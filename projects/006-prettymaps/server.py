"""Local-only map renderer and static preview server. Run from any directory."""
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from render_scene import render, get_layers

DOCS=Path(__file__).resolve().parents[2]/'docs'
LOCK=threading.Lock()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(DOCS),**kwargs)
    def reply(self,status,payload):
        raw=json.dumps(payload,ensure_ascii=False).encode('utf-8')
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        if self.path=='/api/prettymaps/health':
            return self.reply(200,{'available':True,'place':'杭州 · 西湖东北岸','engine':'prettymaps'})
        super().do_GET()
    def do_POST(self):
        if self.path!='/api/prettymaps/render':
            return self.reply(404,{'error':'Not found'})
        origin=self.headers.get('Origin')
        if origin and origin!=f'http://{self.headers.get("Host")}':
            return self.reply(403,{'error':'仅接受本页的生成请求。'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size<1 or size>4096:raise ValueError('请求大小无效。')
            options=json.loads(self.rfile.read(size))
            if not isinstance(options,dict):raise ValueError('参数格式无效。')
            if not LOCK.acquire(blocking=False):return self.reply(409,{'error':'正在生成另一张地图，请稍后再试。'})
            try:result=render(options)
            finally:LOCK.release()
            return self.reply(200,result)
        except (ValueError,TypeError,AttributeError) as exc:
            return self.reply(400,{'error':str(exc)})
        except Exception as exc:
            print(repr(exc),flush=True)
            return self.reply(500,{'error':'生成失败，请查看本地服务日志。'})

if __name__=='__main__':
    get_layers()
    print('http://127.0.0.1:8767/demos/006-prettymaps/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8767),Handler).serve_forever()
