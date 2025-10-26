"""
PostureBot — MCP Client for Groq (Free) Integration
Connects PostureBot to your local posture necklace API using the Model Context Protocol.
Runs fully free using Groq's Llama 3 API.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import aiohttp
from openai import AsyncOpenAI  # Groq uses OpenAI-compatible API
from dotenv import load_dotenv
load_dotenv()
# ────────────────────────────────────────────────────────────────
# ⚙️  CONFIGURATION
# Set your Groq API key before running:
#   export GROQ_API_KEY="gsk_yourGroqKeyHere"
#   python3 mcp_client_groq.py
# ────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MCPMessageType(Enum):
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"


@dataclass
class MCPTool:
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Optional[Dict[str, Any]] = None


class MCPClient:
    def __init__(self, groq_api_key: str, mcp_server_url: str = "http://localhost:5000"):
        self.groq_api_key = groq_api_key
        self.mcp_server_url = mcp_server_url
        self.openai_client = AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"  # 👈 Groq endpoint
        )
        self.session: Optional[aiohttp.ClientSession] = None
        self.available_tools: List[MCPTool] = []
        self._request_id_counter = 0

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def connect(self) -> bool:
        """Initialize and discover available tools from the MCP server"""
        try:
            response = await self._send_mcp_request("initialize", {"protocolVersion": "2024-11-05"})
            if response and not response.get("error"):
                await self._discover_tools()
                logger.info(f"Connected to MCP server at {self.mcp_server_url}")
                return True
        except Exception as e:
            logger.error(f"Error connecting to MCP server: {e}")
        return False

    async def _send_mcp_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Send a request to the MCP server"""
        if not self.session:
            raise RuntimeError("MCP client not connected.")
        payload = {
            "jsonrpc": "2.0",
            "id": str(self._request_id_counter),
            "method": method,
            "params": params or {},
        }
        self._request_id_counter += 1

        try:
            async with self.session.post(
                f"{self.mcp_server_url}/mcp",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as response:
                print(response)
                return await response.json()
        except Exception as e:
            logger.error(f"Error sending MCP request: {e}")
            return {"error": {"message": str(e)}}

    async def _discover_tools(self):
        """List available tools"""
        response = await self._send_mcp_request("tools/list")
        if response and not response.get("error"):
            tools = response.get("result", {}).get("tools", [])
            self.available_tools = [
                MCPTool(
                    name=t["name"],
                    description=t.get("description", ""),
                    input_schema=t.get("inputSchema", {}),
                )
                for t in tools
            ]
            logger.info(f"Discovered {len(self.available_tools)} tools: {[t.name for t in self.available_tools]}")

    async def execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool"""
        response = await self._send_mcp_request("tools/call", {"name": tool_name, "arguments": args})
        return response.get("result", {})

    async def chat_with_tools(self, user_message: str, model: str = "llama-3.1-8b-instant") -> str:
        """Send a message to Llama 3 that only responds to posture-related queries"""
        try:
            # Prepare system prompt
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are PostureBot — a helpful assistant that only answers questions about the user's posture data "
                        "collected by their smart necklace. Use only the MCP-provided data. "
                        "If a question is unrelated to posture, posture advice, neck angle, slouching, ergonomics, breathing, advice, or previous replies "
                        "politely refuse with: 'Sorry! I can only answer posture-related questions based on your necklace data.' "
                        "Assume the most recent day is today, if there are no entries on a date, do not make up data, do not hallucinate data."
                        "Keep replies short, supportive, and data-driven."
                    ),
                },
                {"role": "user", "content": user_message},
            ]

            openai_tools = [
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.input_schema,
                    },
                }
                for tool in self.available_tools
            ]

            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                tools=openai_tools if openai_tools else None,
                # The API expects string values for tool_choice: 'auto', 'required', or 'none'.
                # Passing a Python None serializes to null which the API rejects; send 'none' when
                # no tools are present.
                tool_choice=("auto" if openai_tools else "none"),
            )

            message = response.choices[0].message

            # Handle tool calls
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = json.loads(tool_call.function.arguments or "{}")
                    tool_result = await self.execute_tool(tool_name, tool_args)
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": tool_name,
                            "content": json.dumps(tool_result),
                        }
                    )

                final_response = await self.openai_client.chat.completions.create(
                    model=model, messages=messages
                )
                return final_response.choices[0].message.content
            else:
                return message.content
        except Exception as e:
            logger.error(f"Error in chat_with_tools: {e}")
            return f"Error: {str(e)}"


class MCPChatGroq:
    """Simple interface for PostureBot (Groq version)"""

    def __init__(self, groq_api_key: str, mcp_server_url: str = "http://localhost:5000"):
        self.client = MCPClient(groq_api_key, mcp_server_url)

    async def chat(self, message: str, model) -> str:
        async with self.client:
            return await self.client.chat_with_tools(message, model)


async def main():
    """Run PostureBot (Groq version)"""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print(" Please set your GROQ_API_KEY environment variable.")
        print("   export GROQ_API_KEY='gsk_yourGroqKeyHere'")
        return

    bot = MCPChatGroq(groq_api_key)

    response = await bot.chat("Am I improving compared to yesterday?", model="llama-3.1-8b-instant")
    print("\n PostureBot:", response)


if __name__ == "__main__":
    asyncio.run(main())
