from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from starlette.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional
import ble_service
import mcp_client
import uvicorn
import os
import time
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="BLE data service")
# Allow CORS for local frontend development so browser preflight (OPTIONS)
# requests succeed. In production, narrow allow_origins appropriately.
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
        # Allow common local dev origins (e.g. Vite default 5173) and any
        # localhost/127.0.0.1 port via regex. This is permissive for local
        # development; narrow or remove for production.
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
)


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
    """
    Return a human-readable description of slouch activity.

    Uses the new date-based counters table.
    Summarizes today's posture data and also provides
    a total across the stored date range (up to 30 days). The biggest
    """
    if not ble_service.persistence_enabled():
        raise HTTPException(status_code=400, detail="persistence disabled")

    try:
        conn = ble_service._open_db()
        cur = conn.execute("SELECT MIN(date), MAX(date) FROM counters")
        row = cur.fetchone()
        if not row or not row[0]:
            return "No posture data available yet."

        start_date, end_date = row
        today = time.strftime("%Y-%m-%d")

        # --- Retrieve today's counters ---
        freq_today = ble_service.get_counter("slouch_frequency")
        slouch_time_today = ble_service.get_counter("slouch_time")
        straight_time_today = ble_service.get_counter("straight_time")
        total_today = slouch_time_today + straight_time_today

        # --- Retrieve overall sums (for range summary) ---
        cur = conn.execute(
            """
            SELECT name, SUM(value) AS total
            FROM counters
            WHERE date BETWEEN ? AND ?
            GROUP BY name
            """,
            (start_date, end_date),
        )
        totals = {row["name"]: row["total"] for row in cur.fetchall()}

        freq_total = totals.get("slouch_frequency", 0)
        slouch_time_total = totals.get("slouch_time", 0)
        straight_time_total = totals.get("straight_time", 0)
        total_all = slouch_time_total + straight_time_total

        # --- Compute today's percentages ---
        if total_today > 0:
            pct_slouch_today = round((slouch_time_today / total_today) * 100)
            pct_straight_today = 100 - pct_slouch_today
            ratio_today = (
                f"{round(slouch_time_today / max(1, straight_time_today), 2)}:1"
                if straight_time_today > 0
                else "N/A"
            )
        else:
            pct_slouch_today = pct_straight_today = 0
            ratio_today = "N/A"

        # --- Compute totals percentages ---
        if total_all > 0:
            pct_slouch_all = round((slouch_time_total / total_all) * 100)
            pct_straight_all = 100 - pct_slouch_all
            ratio_all = (
                f"{round(slouch_time_total / max(1, straight_time_total), 2)}:1"
                if straight_time_total > 0
                else "N/A"
            )
        else:
            pct_slouch_all = pct_straight_all = 0
            ratio_all = "N/A"

        # --- Build text description ---
        desc = (
            f"📅 Posture Summary ({start_date} → {end_date})\n"
            f"• Slouch frequency total: {freq_total} occurrences\n"
            f"• Time breakdown — Slouching: {slouch_time_total} ticks ({pct_slouch_all}%), "
            f"Straight: {straight_time_total} ticks ({pct_straight_all}%)\n"
            f"• Ratio (slouch:straight): {ratio_all}\n\n"
            f"🗓️ Today ({today}):\n"
            f"• Slouch frequency: {freq_today} occurrences\n"
            f"• Time breakdown — Slouching: {slouch_time_today} ticks ({pct_slouch_today}%), "
            f"Straight: {straight_time_today} ticks ({pct_straight_today}%)\n"
            f"• Ratio (slouch:straight): {ratio_today}\n"
        )

        print(desc)
        return desc

    except Exception as exc:
        print("Failed to build description:", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/mcp/summary", response_class=PlainTextResponse)
async def mcp_summary():
    """Run the MCP client main() and return the string result.

    This will invoke the async `main()` in `mcp_client.py`, which calls out to
    Groq/OpenAI and the MCP server. Ensure the environment variable
    `GROQ_API_KEY` is set in the server environment; otherwise the client will
    return no result and this endpoint will return a 500 error with a helpful
    message.
    """
    try:
        result = await mcp_client.main()
        if not result:
            raise HTTPException(status_code=500, detail="MCP client did not return a summary. Ensure GROQ_API_KEY is set and MCP server is reachable.")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


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
            time.sleep(.01)
    except WebSocketDisconnect:
        # client disconnected
        await ble_service.unregister_listener(q)
    except Exception:
        # ensure we unregister on any other failure
        await ble_service.unregister_listener(q)
        raise

class ChatRequest(BaseModel):
    message: str


@app.get("/api/chat")
async def isaac():
    """Simple GET helper so callers that accidentally GET the chat route
    receive a helpful 'use POST' response instead of a generic 404/Not Found.
    This also helps debugging from browsers/dev-servers that proxy incorrectly.
    """
    return {"message": "MEOWWW!!!"}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Handle chat requests from the React Postura AI chatbot."""
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY environment variable.")

    try:
        chatbot = mcp_client.MCPChatGroq(groq_key, mcp_server_url="http://localhost:5000")
        response_text = await chatbot.chat(req.message, model="llama-3.1-8b-instant")
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)