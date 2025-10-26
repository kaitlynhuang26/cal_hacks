import asyncio
import os
import sqlite3
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Any

slouching = False

# Import bleak lazily inside the runtime coroutine so the module can be imported
# even when `bleak` is not installed (prevents import-time crash in the server).

SERVICE_UUID = "00001815-0000-1000-8000-00805f9b34fb"
CHAR_UUID = "00002a58-0000-1000-8000-00805f9b34fb"

# In-memory data log. Simple structure matching the original client.
# By default persist samples to a local SQLite DB. Set BLE_PERSIST_DATA=0 to
# disable DB persistence (the service will still stream live samples).
PERSIST_DATA = os.environ.get("BLE_PERSIST_DATA", "1") == "1"

# In-memory data_log is kept for compatibility but DB is the primary store when
# persistence is enabled.
data_log = {"t": [], "ax": [], "ay": [], "az": [], "gx": [], "gy": [], "gz": [], "pitch": []}

# SQLite DB configuration. Default DB file is ./ble_data.db but can be
# overridden with BLE_DB_PATH environment variable.
DB_PATH = os.environ.get("BLE_DB_PATH", "ble_data.db")
_db_lock = threading.Lock()
_db_conn: sqlite3.Connection | None = None


def _open_db() -> sqlite3.Connection:
    global _db_conn
    if _db_conn is not None:
        return _db_conn
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    with conn:
        # Samples table stores raw sensor samples
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                t REAL,
                ax INTEGER,
                ay INTEGER,
                az INTEGER,
                gx INTEGER,
                gy INTEGER,
                gz INTEGER,
                pitch REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        # Small key/value table to store counters like slouch_frequency
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS counters (
                name TEXT PRIMARY KEY,
                value INTEGER NOT NULL DEFAULT 0
            )
            """
        )
    _db_conn = conn
    return _db_conn


def persistence_enabled() -> bool:
    """Return True when persistent storage of samples is enabled."""
    return PERSIST_DATA

# Store the most recent sample for live access.
last_sample: dict | None = None
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
    global slouching
    t = time.time() - start_t
    vals = [int(x) - 128 for x in data]
    # If the BLE payload ever changes size, ignore malformed payloads.
    if len(vals) < 6:
        return
    ax, ay, az, gx, gy, gz = vals[:6]
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

    if PERSIST_DATA:
        try:
            conn = _open_db()
            with _db_lock:
                # store the raw sample
                conn.execute(
                    "INSERT INTO samples (t, ax, ay, az, gx, gy, gz) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (t, ax, ay, az, gx, gy, gz),
                )
                # If we detect transition into slouching, increment counter atomically
                if az > 64 and not slouching:
                    slouching = True
                    conn.execute(
                        """
                        INSERT INTO counters(name, value) VALUES ('slouch_frequency', 1)
                        ON CONFLICT(name) DO UPDATE SET value = value + 1
                        """
                    )
                elif az < 50 and slouching:
                    slouching = False
                conn.commit()
        except Exception as exc:
            print("Failed to write sample or update slouch frequency in DB:", exc)


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


async def _run(device_name: str = "XIAOMG25_BLE") -> None:
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

            sample = {"t": t, "ax": ax, "ay": ay, "az": az, "gx": gx, "gy": gy, "gz": gz}

            # persist only when enabled
            if PERSIST_DATA:
                try:
                    conn = _open_db()
                    with _db_lock:
                        conn.execute(
                            "INSERT INTO samples (t, ax, ay, az, gx, gy, gz) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            (t, ax, ay, az, gx, gy, gz),
                        )
                        conn.commit()
                except Exception as exc:
                    print("Failed to write simulated sample to DB:", exc)

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


def start(device_name: str = "XIAOMG25_BLE") -> None:
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
    # If persistence is enabled, read all samples from the DB and return as
    # arrays. Otherwise return the in-memory `data_log` copies (may be empty).
    if PERSIST_DATA:
        try:
            conn = _open_db()
            cur = conn.execute("SELECT t, ax, ay, az, gx, gy, gz, pitch FROM samples ORDER BY id ASC")
            rows = cur.fetchall()
            out = {"t": [], "ax": [], "ay": [], "az": [], "gx": [], "gy": [], "gz": [], "pitch": []}
            for r in rows:
                out["t"].append(r["t"])
                out["ax"].append(r["ax"])
                out["ay"].append(r["ay"])
                out["az"].append(r["az"])
                out["gx"].append(r["gx"])
                out["gy"].append(r["gy"])
                out["gz"].append(r["gz"])
                out["pitch"].append(r["pitch"])
            return out
        except Exception as exc:
            print("Failed to read data from DB:", exc)
            return {k: v[:] for k, v in data_log.items()}

    # Return shallow copies to avoid accidental mutation by consumers.
    return {k: v[:] for k, v in data_log.items()}


def get_latest() -> dict:
    """Return the latest sample or an empty dict if none."""
    # If persistence is enabled, return the last DB sample.
    if PERSIST_DATA:
        try:
            conn = _open_db()
            cur = conn.execute(
                "SELECT t, ax, ay, az, gx, gy, gz, pitch FROM samples ORDER BY id DESC LIMIT 1"
            )
            row = cur.fetchone()
            if row is None:
                return {}
            return {"t": row["t"], "ax": row["ax"], "ay": row["ay"], "az": row["az"], "gx": row["gx"], "gy": row["gy"], "gz": row["gz"], "pitch": row["pitch"]}
        except Exception as exc:
            print("Failed to read latest from DB:", exc)
            # fallback to in-memory last_sample
            if last_sample:
                return last_sample
            return {}

    # When persistence is disabled, return the last live sample if available.
    if last_sample:
        return last_sample
    return {}


def get_counter(name: str) -> int:
    """Return the integer value for a named counter (0 if missing)."""
    try:
        conn = _open_db()
        cur = conn.execute("SELECT value FROM counters WHERE name = ?", (name,))
        row = cur.fetchone()
        if row is None:
            return 0
        return int(row["value"])
    except Exception as exc:
        print("Failed to read counter from DB:", exc)
        return 0


def reset_counter(name: str) -> None:
    """Reset (set to 0) the named counter, creating it if necessary."""
    try:
        conn = _open_db()
        with _db_lock:
            conn.execute(
                "INSERT INTO counters(name, value) VALUES (?, 0) ON CONFLICT(name) DO UPDATE SET value = 0",
                (name,),
            )
            conn.commit()
    except Exception as exc:
        print("Failed to reset counter in DB:", exc)


def prune_samples(older_than_days: int) -> int:
    """Delete samples older than `older_than_days`. Returns number of rows deleted."""
    try:
        cutoff = datetime.utcnow() - timedelta(days=older_than_days)
        cutoff_str = cutoff.strftime("%Y-%m-%d %H:%M:%S")
        conn = _open_db()
        with _db_lock:
            cur = conn.execute("DELETE FROM samples WHERE created_at < ?", (cutoff_str,))
            deleted = cur.rowcount
            conn.commit()
        return deleted
    except Exception as exc:
        print("Failed to prune samples from DB:", exc)
        return 0
