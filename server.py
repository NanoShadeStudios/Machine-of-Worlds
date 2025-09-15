#!/usr/bin/env python3
"""
Simple HTTP server for The Machine of Worlds game
Serves static files on port 5000 with proper CORS headers
"""

import http.server
import socketserver
import os

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        # Disable caching to ensure updates are visible in Replit iframe
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[Server] {format % args}")

def run_server():
    PORT = 5000
    HOST = "0.0.0.0"  # Allow connections from any host (required for Replit proxy)
    
    # Change to the directory containing our static files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"[Server] Starting HTTP server on {HOST}:{PORT}")
    print(f"[Server] Serving files from: {os.getcwd()}")
    print(f"[Server] Game available at: http://{HOST}:{PORT}")
    
    with socketserver.TCPServer((HOST, PORT), CORSHTTPRequestHandler) as httpd:
        print(f"[Server] Server ready and listening...")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()