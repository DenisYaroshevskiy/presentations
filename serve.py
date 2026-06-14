#!/usr/bin/env python3
import http.server

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

http.server.test(HandlerClass=NoCacheHandler, port=8080)
