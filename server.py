import http.server
import socketserver
import json
import sqlite3
import urllib.parse
import os

PORT = 8000
DB_FILE = 'votes.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY,
            name TEXT,
            vote_count INTEGER DEFAULT 0
        )
    ''')
    
    # Check if we have candidates
    c.execute('SELECT COUNT(*) FROM candidates')
    if c.fetchone()[0] == 0:
        c.execute('INSERT INTO candidates (name, vote_count) VALUES ("Kandidat A", 0)')
        c.execute('INSERT INTO candidates (name, vote_count) VALUES ("Kandidat B", 0)')
        conn.commit()
    conn.close()

class VoteRequestHandler(http.server.SimpleHTTPRequestHandler):
    
    def do_GET(self):
        if self.path == '/api/votes':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('SELECT id, name, vote_count FROM candidates')
            candidates = [{'id': row[0], 'name': row[1], 'vote_count': row[2]} for row in c.fetchall()]
            conn.close()
            
            response = json.dumps({'candidates': candidates})
            self.wfile.write(response.encode())
        else:
            # Serve static files (index.html, style.css, script.js)
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/vote':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                candidate_id = data.get('candidate_id')
                
                if candidate_id:
                    conn = sqlite3.connect(DB_FILE)
                    c = conn.cursor()
                    c.execute('UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?', (candidate_id,))
                    conn.commit()
                    conn.close()
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode())
                else:
                    self.send_response(400)
                    self.end_headers()
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    init_db()
    with socketserver.TCPServer(("", PORT), VoteRequestHandler) as httpd:
        print(f"Server berjalan di http://localhost:{PORT}")
        httpd.serve_forever()
