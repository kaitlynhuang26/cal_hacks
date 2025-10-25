import asyncio
import os
import time
from typing import Dict, Any

# Import bleak lazily inside the runtime coroutine so the module can be imported
# even when `bleak` is not installed (prevents import-time crash in the server).

SERVICE_UUID = "00001815-0000-1000-8000-00805f9b34fb"
CHAR_UUID = "00002a58-0000-1000-8000-00805f9b34fb"

# In-memory data log. Simple structure matching the original client.
# By default do not persist samples to avoid storing large arrays in the API
# server. Enable persistence by setting BLE_PERSIST_DATA=1 in the environment.
PERSIST_DATA = os.environ.get("BLE_PERSIST_DATA", "0") == "1"

data_log = {"t": [], "ax": [], "ay": [], "az": [], "gx": [], "gy": [], "gz": [], "pitch": []}
# Store the most recent sample for live access when persistence is disabled.
last_sample: dict | None = None
def persistence_enabled() -> bool:
    """Return True when persistent storage of samples is enabled."""
    return PERSIST_DATA
start_t = time.time()

# Internal control variables
_stop_event: asyncio.Event | None = None
_task: asyncio.Task | None = None

# Pub/sub listeners for live streaming. Each listener is an asyncio.Queue.
# Callers (e.g. WebSocket handlers) should register to receive live samples.
_listeners: list[asyncio.Queue] = []


async def register_listener(maxsize: int = 100) -> asyncio.Queue:
    """Register a new asyncio.Queue listener and return it.

    The caller should `await unregister_listener(q)` when finished.
    """
    q: asyncio.Queue = asyncio.Queue(maxsize=maxsize)
    _listeners.append(q)
    return q


async def unregister_listener(q: asyncio.Queue) -> None:
    try:
        _listeners.remove(q)
    except ValueError:
        pass


def handle_indication(_: Any, data: bytearray) -> None:
    """Convert raw BLE bytes to signed values and append to data_log.

    This mirrors the logic in the provided client script, but doesn't do plotting.
    """
    t = time.time() - start_t
    vals = [int(x) - 128 for x in data]
    # If the BLE payload ever changes size, ignore malformed payloads.
    if len(vals) < 6:
        return
    ax, ay, az, gx, gy, gz = vals[:6]
    # Append to persistent log only when enabled. Live streaming is
    # dispatched to listeners regardless of persistence mode.
    if PERSIST_DATA:
        data_log["t"].append(t)
        data_log["ax"].append(ax)
        data_log["ay"].append(ay)
        data_log["az"].append(az)
        data_log["gx"].append(gx)
        data_log["gy"].append(gy)
        data_log["gz"].append(gz)

    # Prepare a lightweight sample payload for live streaming
    sample = {
        "t": t,
        "ax": ax,
        "ay": ay,
        "az": az,
        "gx": gx,
        "gy": gy,
        "gz": gz,
    }

    # Update the last seen sample (always keep this for live retrieval).
    global last_sample
    last_sample = sample

    # Dispatch to any registered asyncio listeners (non-blocking)
    for q in list(_listeners):
        try:
            q.put_nowait(sample)
        except asyncio.QueueFull:
            # slow consumer — drop this sample for that consumer
            pass


async def _run(device_name: str = "XIAOMG24_BLE") -> None:
    """Background coroutine that connects to BLE device and subscribes to notifications.

    Keeps reconnecting if device is not found or connection is lost until stop() is called.
    """
    global _stop_event
    _stop_event = asyncio.Event()

    # Try importing bleak at runtime. If it's missing, print a helpful message
    # and wait until stop() is called instead of crashing the whole process.
    try:
        from bleak import BleakClient, BleakScanner
    except Exception as exc:
        # If bleak isn't available, fall back to a simple simulation mode so the
        # server remains useful for development and testing. This generates
        # synthetic samples and appends them to `data_log` until stop() is
        # requested. Installing `bleak` will enable real BLE collection.
        print("bleak is not available; entering simulation mode. Install bleak to enable real BLE.")
        print("Import error:", exc)
        import random

        # Simple synthetic data generator: small random walk around zero.
        ax = ay = az = gx = gy = gz = 0
        while not _stop_event.is_set():
            t = time.time() - start_t
            # random step between -3 and 3
            ax += random.randint(-3, 3)
            ay += random.randint(-3, 3)
            az += random.randint(-3, 3)
            gx += random.randint(-2, 2)
            gy += random.randint(-2, 2)
            gz += random.randint(-2, 2)

            # persist only when enabled
            if PERSIST_DATA:
                data_log["t"].append(t)
                data_log["ax"].append(ax)
                data_log["ay"].append(ay)
                data_log["az"].append(az)
                data_log["gx"].append(gx)
                data_log["gy"].append(gy)
                data_log["gz"].append(gz)

            sample = {"t": t, "ax": ax, "ay": ay, "az": az, "gx": gx, "gy": gy, "gz": gz}
            # Update the last seen sample (always keep this for live retrieval).
            global last_sample
            last_sample = sample

            for q in list(_listeners):
                try:
                    q.put_nowait(sample)
                except asyncio.QueueFull:
                    pass

            # emit samples at ~5 Hz
            await asyncio.sleep(0.2)
        return

    while not _stop_event.is_set():
        device = await BleakScanner.find_device_by_name(device_name)
        if not device:
            # back off and try again
            await asyncio.sleep(2)
            continue

        try:
            async with BleakClient(device) as client:
                await client.start_notify(CHAR_UUID, handle_indication)
                # Wait until stop requested.
                await _stop_event.wait()
                await client.stop_notify(CHAR_UUID)
        except Exception as exc:  # keep running on errors
            print("BLE client error:", exc)
            await asyncio.sleep(1)


def start(device_name: str = "XIAOMG24_BLE") -> None:
    """Start the BLE background task.

    If called from an existing asyncio event loop (e.g. when FastAPI runs), it schedules
    the coroutine there. Otherwise, it spins a background thread with its own event loop
    so the BLE task runs independently.
    """
    global _task

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # schedule in current loop
        if _task is None or _task.done():
            _task = asyncio.create_task(_run(device_name))
    else:
        # no running loop — create a dedicated thread + loop
        import threading

        def _start_loop_in_thread():
            new_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(new_loop)
            new_loop.run_until_complete(_run(device_name))

        thread = threading.Thread(target=_start_loop_in_thread, daemon=True)
        thread.start()
        _task = thread  # store thread reference so stop() can be called


def stop() -> None:
    """Request the BLE background task to stop."""
    if _stop_event and not _stop_event.is_set():
        _stop_event.set()


def get_data() -> Dict[str, list]:
    """Return a copy of the recorded data (safe for JSON serialization)."""
    # Return shallow copies to avoid accidental mutation by consumers.
    return {k: v[:] for k, v in data_log.items()}


def get_latest() -> dict:
    """Return the latest sample or an empty dict if none."""
    # If we're persisting data, return the last entry from the stored log.
    if PERSIST_DATA:
        if not data_log["t"]:
            return {}
        idx = -1
        return {k: (v[idx] if v else None) for k, v in data_log.items()}

    # When persistence is disabled, return the last live sample if available.
    if last_sample:
        return last_sample
    return {}
