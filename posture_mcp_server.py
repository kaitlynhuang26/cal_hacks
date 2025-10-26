from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from typing import Any, Dict, Optional
import httpx

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
        # Call the local FastAPI endpoint that returns the human-readable
        # posture description and return it as the MCP call result. This
        # allows the model (Groq Llama) to receive the summary text as a
        # tool response.
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("http://127.0.0.1:8000/db/description")
            if resp.status_code == 200:
                text = resp.text
                return {"result": {"description": text}}
            else:
                return {"error": {"message": f"Upstream returned {resp.status_code}: {resp.text}"}}
        except Exception as exc:
            return {"error": {"message": f"Failed to call upstream description API: {exc}"}}

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
