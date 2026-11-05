"""Blender MCP 서버로 파이썬 파일 하나를 보내 실행하고 결과를 찍는다. 사용: python blrun.py script.py"""
import asyncio
import json
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

EXE = r"C:\Users\yoons\.blender-mcp\venv\Scripts\blender-mcp.exe"


async def main(path):
    code = open(path, encoding="utf8").read()
    async with stdio_client(StdioServerParameters(command=EXE, args=[])) as (r, w):
        async with ClientSession(r, w) as s:
            await s.initialize()
            res = await s.call_tool("execute_blender_code", {"code": code})
            for c in res.content:
                t = getattr(c, "text", None)
                if t is None:
                    print(c)
                    continue
                try:
                    d = json.loads(t)
                    print("STATUS", d.get("status"))
                    print(d.get("stdout", ""))
                    if d.get("stderr"):
                        print("STDERR", d["stderr"][-3000:])
                    if d.get("error") or d.get("traceback"):
                        print("ERROR", d.get("error"), d.get("traceback", "")[-3000:])
                except ValueError:
                    print(t[-4000:])


asyncio.run(main(sys.argv[1]))
