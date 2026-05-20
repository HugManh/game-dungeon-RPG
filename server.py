import http.server
import socketserver
import os
import json

# Web server for demo
base_dir = os.path.dirname(os.path.abspath(__file__))
META_DIR = os.path.join(base_dir, 'meta')
SETTINGS_FILE = os.path.join(META_DIR, 'settings.json')
PORT = int(os.environ.get('PORT', 3000))

# Ensure meta dir exists
if not os.path.exists(META_DIR):
    os.makedirs(META_DIR)

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/settings':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                settings = json.loads(post_data.decode('utf-8'))
                with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(settings, f, indent=4)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
            return
        
        # For other paths, we don't support POST in SimpleHTTPRequestHandler
        self.send_error(405, "Method not allowed")

    def do_GET(self):
        if self.path == '/api/settings':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            if os.path.exists(SETTINGS_FILE):
                with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
            else:
                self.wfile.write(json.dumps({}).encode('utf-8'))
            return
        
        return super().do_GET()

    def translate_path(self, path):
        # Default to web/demo directory
        if path == '/' or path == '/index.html':
            return os.path.join(base_dir, 'demo', 'index.html')
        
        # Check if path exists in demo directory
        demo_path = os.path.join(base_dir, 'demo', path.lstrip('/'))
        if os.path.exists(demo_path):
            return demo_path
            
        return super().translate_path(path)

if __name__ == "__main__":
    os.chdir(base_dir)
    # Allow address reuse to avoid "Address already in use" errors during quick restarts
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Web Demo Server running at http://localhost:{PORT}")
        httpd.serve_forever()
