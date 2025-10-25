# BLE FastAPI service

This small service exposes BLE sensor data collected from a device named `XIAOMG24_BLE`.

How it works
- `ble_service.py` — rewritten, importable BLE client that collects notifications into `data_log` and offers `start()`, `stop()`, `get_data()`, and `get_latest()` functions.
- `server.py` — FastAPI application exposing endpoints to read the data and control the BLE background task.

Quickstart

1) Install dependencies (preferably in a venv):

```bash
python -m pip install -r requirements.txt
```

2) Run the server (from repo root):

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

3) Endpoints:
- `GET /data` — all recorded samples
- `GET /data/latest` — latest sample
- `POST /control/start` — start BLE collection (accepts JSON {"device_name":"XIAOMG24_BLE"})
- `POST /control/stop` — stop collection

Streaming
- `WebSocket /ws` — connect and receive live JSON samples as they arrive. Each message is a small JSON object: {"t":..., "ax":..., "ay":..., "az":..., "gx":..., "gy":..., "gz":...}

Notes
- This service starts BLE collection automatically on FastAPI startup. Remove the automatic start in `server.py` if you prefer manual control.
- The BLE client will keep reconnecting on disconnects and runs until stopped.
