// Masaüstü kabuğu için küçük statik sunucu.
// Dosyalar file:// yerine http://127.0.0.1 üzerinden sunulur; böylece ES
// modülleri ve localStorage tarayıcıdaki gibi çalışır.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".md": "text/markdown; charset=utf-8",
};

function startServer(root, { host = "127.0.0.1", port = 0 } = {}) {
  const base = path.resolve(root);

  const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end("Yöntem desteklenmiyor");
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      res.end("Geçersiz adres");
      return;
    }

    if (pathname.endsWith("/")) pathname += "index.html";

    const file = path.resolve(base, "." + pathname);
    if (file !== base && !file.startsWith(base + path.sep)) {
      res.writeHead(403);
      res.end("Yasak");
      return;
    }

    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Bulunamadı");
        return;
      }

      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Content-Length": stat.size,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      const stream = fs.createReadStream(file);
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const { port: actual } = server.address();
      resolve({
        url: `http://${host}:${actual}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

module.exports = { startServer };
