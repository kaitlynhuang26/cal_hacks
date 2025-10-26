from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, PlainTextResponse
from pydantic import BaseModel
from typing import Optional
import ble_service

app = FastAPI(title="BLE data service")


class ControlRequest(BaseModel):
    device_name: str = "XIAOMG24_BLE"


@app.on_event("startup")
async def startup_event():
    # Start BLE data collection automatically on server startup.
    # If you prefer manual control, remove/modify this.
    ble_service.start()


@app.get("/status")
def status():
    # very small status endpoint
    count = len(ble_service.get_data().get("t", []))
    return {"running": True, "samples": count}


@app.get("/data")
def read_all():
    return ble_service.get_data()


@app.get("/data/latest")
def read_latest():
    latest = ble_service.get_latest()
    if not latest:
        raise HTTPException(status_code=404, detail="no data yet")
    return latest


@app.get("/db/samples")
def db_samples(limit: int = 100, offset: int = 0, start_t: Optional[float] = None, end_t: Optional[float] = None):
    """Return samples from the underlying SQLite DB.

    Query params:
    - limit: max rows to return (default 100)
    - offset: rows to skip (paging)
    - start_t, end_t: optional numeric t-range filters
    """
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")
    rows = ble_service.query_samples(limit=limit, offset=offset, start_t=start_t, end_t=end_t)
    return {"count": len(rows), "samples": rows}


@app.get("/db/counters/slouch_frequency")
def db_get_slouch_counter():
    """Return the 'slouch_frequency' counter value."""
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")
    name = "slouch_frequency"
    return {"name": name, "value": ble_service.get_counter(name)}


@app.post("/db/counters/slouch_frequency/reset")
def db_reset_slouch_counter():
    """Reset the 'slouch_frequency' counter to zero."""
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")
    name = "slouch_frequency"
    ble_service.reset_counter(name)
    return {"status": "ok", "name": name}


@app.get("/db/counters/slouch_time")
def db_get_slouch_time():
    """Return the 'slouch_time' counter value."""
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")
    name = "slouch_time"
    return {"name": name, "value": ble_service.get_counter(name)}


@app.post("/db/counters/slouch_time/reset")
def db_reset_slouch_time():
    """Reset the 'slouch_time' counter to zero."""
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")
    name = "slouch_time"
    ble_service.reset_counter(name)
    return {"status": "ok", "name": name}


@app.get("/db/counters/straight_time")
def db_get_straight_time():
    """Return the 'straight_time' counter value."""
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")
    name = "straight_time"
    return {"name": name, "value": ble_service.get_counter(name)}


@app.post("/db/counters/straight_time/reset")
def db_reset_straight_time():
    """Reset the 'straight_time' counter to zero."""
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")
    name = "straight_time"
    ble_service.reset_counter(name)
    return {"status": "ok", "name": name}


@app.get("/db/description", response_class=PlainTextResponse)
def db_description():
    """Return a human-readable description of slouch activity.

    The description includes slouch_frequency (number of slouch events) and
    a simple ratio/percentage breakdown of slouch_time vs straight_time.
    """
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")

    freq = ble_service.get_counter("slouch_frequency")
    slouch_time = ble_service.get_counter("slouch_time")
    straight_time = ble_service.get_counter("straight_time")

    total = slouch_time + straight_time
    if total > 0:
        pct_slouch = round((slouch_time / total) * 100)
        pct_straight = 100 - pct_slouch
        # ratio in form X:Y (rounded)
        try:
            ratio = f"{round(slouch_time / max(1, straight_time), 2)}:1" if straight_time > 0 else "N/A"
        except Exception:
            ratio = "N/A"
    else:
        pct_slouch = pct_straight = 0
        ratio = "N/A"

    desc = (
        f"Slouch frequency: {freq} occurrences. "
        f"Time breakdown — Slouching: {slouch_time} ticks ({pct_slouch}%), "
        f"Straight: {straight_time} ticks ({pct_straight}%). "
        f"Ratio (slouch:straight): {ratio}."
    )

    return desc


@app.post("/control/start")
def control_start(req: ControlRequest):
    ble_service.start(req.device_name)
    return {"status": "started", "device_name": req.device_name}


@app.post("/control/stop")
def control_stop():
    ble_service.stop()
    return {"status": "stopping"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint that streams live samples as JSON.

    Behavior: when a client connects it registers a listener queue, then forwards
    samples received on that queue to the WebSocket. When the client disconnects
    the listener is unregistered.
    """
    await websocket.accept()
    q = await ble_service.register_listener()
    try:
        while True:
            sample = await q.get()
            await websocket.send_json(sample)
    except WebSocketDisconnect:
        # client disconnected
        await ble_service.unregister_listener(q)
    except Exception:
        # ensure we unregister on any other failure
        await ble_service.unregister_listener(q)
        raise

