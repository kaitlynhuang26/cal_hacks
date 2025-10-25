from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
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
