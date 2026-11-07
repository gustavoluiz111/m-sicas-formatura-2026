import http.server
import socketserver
import json
import os
import re
import hashlib
import urllib.request
import urllib.parse

PORT = 8000
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
DATA_FILE = os.path.join(DATA_DIR, 'formandos.json')
CONFIG_FILE = os.path.join(DATA_DIR, 'config.json')

os.makedirs(DATA_DIR, exist_ok=True)

DEFAULT_CONFIG = {
    # Senha padrão: admin2026
    "admin_password_hash": hashlib.sha256("admin2026".encode('utf-8')).hexdigest()
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_CONFIG

def save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

def hash_pw(pw):
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()

def parse_youtube_title(raw_title, author_name=""):
    clean_title = raw_title.strip()
    artist = ""
    song = clean_title

    separators = [' - ', ' – ', ' — ', ': ']
    for sep in separators:
        if sep in clean_title:
            parts = clean_title.split(sep, 1)
            artist = parts[0].strip()
            song = parts[1].strip()
            break

    clean_pattern = r'\s*(\[|\()(official\s*(music\s*)?video|clipe?\s*oficial|vídeo\s*oficial|audio|áudio\s*oficial|lyric\s*video|letra|legendado|hd|4k|ao\s*vivo|live|remaster(ed)?|videoclipe).*?(\]|\))\s*'
    song = re.sub(clean_pattern, '', song, flags=re.IGNORECASE).strip()
    artist = re.sub(clean_pattern, '', artist, flags=re.IGNORECASE).strip()

    if not artist and author_name:
        clean_author = re.sub(r'(vevo|oficial|official)$', '', author_name, flags=re.IGNORECASE).strip()
        artist = clean_author

    song = song.strip(' "“”\'')
    artist = artist.strip(' "“”\'')
    return song, artist

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # Endpoint: /api/formandos
        if path == '/api/formandos':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b'[]')
            return

        # Endpoint: /api/youtube-info?url=...
        if path == '/api/youtube-info':
            query = urllib.parse.parse_qs(parsed_url.query)
            video_url = query.get('url', [''])[0]
            if not video_url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "URL obrigatoria"}).encode('utf-8'))
                return

            try:
                oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(video_url)}&format=json"
                req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    raw_title = data.get('title', '')
                    author = data.get('author_name', '')
                    song, artist = parse_youtube_title(raw_title, author)

                    result = {
                        "song": song,
                        "artist": artist,
                        "fullTitle": raw_title,
                        "author": author,
                        "thumbnail": data.get('thumbnail_url', '')
                    }

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'

        # Endpoint: Login de Admin
        if path == '/api/admin-login':
            try:
                payload = json.loads(body.decode('utf-8'))
                entered_pw = payload.get('password', '')
                config = load_config()
                if hash_pw(entered_pw) == config.get("admin_password_hash"):
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True, "token": config.get("admin_password_hash")}).encode('utf-8'))
                else:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "message": "Senha incorreta!"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Endpoint: Alterar Senha de Admin
        if path == '/api/admin-change-password':
            try:
                payload = json.loads(body.decode('utf-8'))
                current_pw = payload.get('currentPassword', '')
                new_pw = payload.get('newPassword', '')
                config = load_config()

                if hash_pw(current_pw) != config.get("admin_password_hash"):
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "message": "Senha atual incorreta!"}).encode('utf-8'))
                    return

                if len(new_pw) < 4:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "message": "A nova senha deve ter pelo menos 4 dígitos!"}).encode('utf-8'))
                    return

                config["admin_password_hash"] = hash_pw(new_pw)
                save_config(config)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "token": config["admin_password_hash"]}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Endpoint: Salvar Formandos (/api/formandos)
        if path == '/api/formandos':
            try:
                data = json.loads(body.decode('utf-8'))
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "count": len(data)}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    # Salva config se não existir
    if not os.path.exists(CONFIG_FILE):
        save_config(DEFAULT_CONFIG)
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Servidor ativo em http://localhost:{PORT}")
        httpd.serve_forever()
