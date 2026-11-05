import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

EXE = r"C:\Users\yoons\.blender-mcp\venv\Scripts\blender-mcp.exe"


async def main():
    async with stdio_client(StdioServerParameters(command=EXE, args=[])) as (r, w):
        async with ClientSession(r, w) as s:
            await s.initialize()
            res = await s.call_tool("execute_blender_code", {"code": "import bpy\nprint(bpy.app.version_string, [o.name for o in bpy.data.objects])"})
            for c in res.content:
                print("RESULT", getattr(c, "text", c))


asyncio.run(main())
