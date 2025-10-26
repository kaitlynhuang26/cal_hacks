from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
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
