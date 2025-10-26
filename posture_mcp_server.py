from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from typing import Any, Dict, Optional

app = FastAPI()

async def _send_mcp_request(_, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    # Mock data mode
    if method == "tools/list":
        return {
            "result": {
                "tools": [
                    {
                        "name": "get_posture_data",
                        "description": "Mock tool for testing posture queries",
                        "inputSchema": {"type": "object", "properties": {}}
                    }
                ]
            }
        }

    elif method == "tools/call":
        # Return mock posture data
        return {
            "result": {
                "avg_neck_angle": 18.4,
                "slouch_time_minutes": 25,
                "posture_score": 82,
                "trend": "improving"
            }
        }

    elif method == "initialize":
        return {"result": {"status": "ok"}}

    return {"error": {"message": "Mock: Unknown method"}}


@app.post("/mcp")
async def handle_mcp(request: Request):
    body = await request.json()
    method = body.get("method")
    params = body.get("params")
    result = await _send_mcp_request(None, method, params)
    return JSONResponse(result)


if __name__ == "__main__":
    print(" Starting mock MCP posture server on http://localhost:3000/mcp ...")
    uvicorn.run(app, host="0.0.0.0", port=3000)
