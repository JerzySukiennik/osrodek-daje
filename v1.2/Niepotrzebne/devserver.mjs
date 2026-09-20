// Local dev server: static files, GET /lanip (so the QR points at this machine on Wi-Fi), POST /feedback → feedback/*.json.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || process.argv[2] || 5191);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wasm": "application/wasm"
};

function lanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) if (n.family === "IPv4" && !n.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(n.address)) return n.address;
  }
  return null;
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/lanip") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ip: lanIp() }));
    return;
  }
  if (url.pathname === "/feedback" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const dir = path.join(ROOT, "feedback");
        fs.mkdirSync(dir, { recursive: true });
        const name = `${data.phase || "lab"}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        const text = JSON.stringify(data, null, 2);
        fs.writeFileSync(path.join(dir, name), text);
        fs.writeFileSync(path.join(dir, "latest.json"), text);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, file: `feedback/${name}` }));
      } catch (e) {
        res.writeHead(400);
        res.end("bad json");
      }
    });
    return;
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || /\/(Niepotrzebne|reference|\.git)\//.test(file)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(data);
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Ośrodek Daje dev server: http://localhost:${PORT}  (LAN: http://${lanIp() || "?"}:${PORT})`);
});
