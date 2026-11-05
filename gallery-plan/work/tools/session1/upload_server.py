"""갤러리 사본을 내주고, 브라우저가 보낸 glTF를 받아 저장하는 작은 로컬 서버.
python upload_server.py <내줄 폴더> <저장 폴더> <포트>"""
import http.server
import os
import sys

ROOT, OUT, PORT = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]), int(sys.argv[3])
os.makedirs(OUT, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_POST(self):
        name = os.path.basename(self.path.split("?")[0]) or "upload.bin"
        n = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(n)
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(f"saved {name} {len(data)}".encode())


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
