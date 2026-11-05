import sys, asyncio
from playwright.async_api import async_playwright
url, out = sys.argv[1], sys.argv[2]
keys = sys.argv[3] if len(sys.argv) > 3 else ''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', headless=True, args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 760})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.goto(url); await pg.wait_for_timeout(9000)
        for part in keys.split(',') if keys else []:
            k, ms = part.split(':', 1)
            if k == 'click':
                await pg.get_by_role('button', name=ms, exact=True).first.click(); await pg.wait_for_timeout(3500); continue
            if k == 'dragx':
                await pg.mouse.move(640, 500); await pg.mouse.down()
                for i in range(20): await pg.mouse.move(640 + int(ms) * (i + 1) / 20, 500)
                await pg.mouse.up(); await pg.wait_for_timeout(600); continue
            if k == 'drag':
                await pg.mouse.move(640, 500); await pg.mouse.down()
                for i in range(20): await pg.mouse.move(640, 500 + int(ms) * (i + 1) / 20)
                await pg.mouse.up(); await pg.wait_for_timeout(600); continue
            await pg.keyboard.down(k); await pg.wait_for_timeout(int(ms)); await pg.keyboard.up(k); await pg.wait_for_timeout(400)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=out)
        print('errors:', errs[:5])
        await b.close()
asyncio.run(main())
