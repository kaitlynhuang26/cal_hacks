#!/usr/bin/env python3
"""Lightweight API client for the BLE FastAPI service.

Behavior:
- Tries to use the WebSocket `/ws` endpoint for live updates if the `websockets`
  package is installed.
- If `websockets` isn't available, falls back to HTTP polling `/data/latest`
  using `requests` (if installed); otherwise it will print an instruction.

Usage:
  python api_client.py            # try ws, fallback to polling
  python api_client.py --poll     # force HTTP polling
  python api_client.py --ws      # force WebSocket

This script is intentionally small and dependency-light. It attempts to do
the right thing with minimal setup.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import time
import sys


DEFAULT_HTTP = "http://localhost:8000/data/latest"
DEFAULT_WS = "ws://localhost:8000/ws"


def print_sample(sample: dict) -> None:
    # compact one-line output with timestamp
    t = sample.get("t")
    ax = sample.get("ax")
    ay = sample.get("ay")
    az = sample.get("az")
    gx = sample.get("gx")
    gy = sample.get("gy")
    gz = sample.get("gz")
    ts = f"{t:6.2f}s" if isinstance(t, (int, float)) else str(t)
    print(f"{ts}  ax={ax:3} ay={ay:3} az={az:3} | gx={gx:3} gy={gy:3} gz={gz:3}")


async def ws_client(uri: str) -> None:
    try:
        import websockets
    except Exception:
        print("'websockets' package not installed; cannot use WebSocket mode.")
        return

    print(f"Connecting WebSocket {uri}...")
    try:
        async with websockets.connect(uri) as ws:
            async for msg in ws:
                try:
                    sample = json.loads(msg)
                except Exception:
                    print("received non-json message:", msg)
                    continue
                print_sample(sample)
    except Exception as exc:
        print("WebSocket error:", exc)


def poll_http(url: str, interval: float = 1.0) -> None:
    try:
        import requests
    except Exception:
        print("'requests' not installed; install it or run with websockets available.")
        print("pip install requests")
        return

    print(f"Polling {url} every {interval}s...")
    while True:
        try:
            r = requests.get(url, timeout=2.0)
            if r.status_code == 200:
                try:
                    sample = r.json()
                    print_sample(sample)
                except Exception:
                    print("failed to decode JSON from response")
            else:
                print(f"HTTP {r.status_code}")
        except Exception as exc:
            print("request error:", exc)
        time.sleep(interval)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--ws", action="store_true", help="force WebSocket mode")
    p.add_argument("--poll", action="store_true", help="force HTTP polling mode")
    p.add_argument("--url", default=None, help="custom URL for HTTP polling or WS (prefix ws:// for WS)")
    args = p.parse_args()

    if args.url:
        if args.url.startswith("ws://") or args.url.startswith("wss://"):
            uri = args.url
            mode = "ws"
        else:
            uri = args.url
            mode = "poll"
    else:
        uri = None
        mode = None

    # Determine mode
    if args.ws:
        mode = "ws"
    if args.poll:
        mode = "poll"

    if mode == "ws":
        ws_uri = uri or DEFAULT_WS
        asyncio.run(ws_client(ws_uri))
        return

    if mode == "poll":
        http_url = uri or DEFAULT_HTTP
        poll_http(http_url)
        return

    # Auto mode: prefer WebSocket if websockets installed
    try:
        import websockets  # type: ignore
        asyncio.run(ws_client(DEFAULT_WS))
        return
    except Exception:
        # fall back to requests polling
        poll_http(DEFAULT_HTTP)


if __name__ == "__main__":
    main()
