// Minimal static server for the exported site in out/, no dependencies.
// Mirrors GitHub Pages: /x/ serves x/index.html, unknown paths get 404.html with status 404.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "out");
const port = Number(process.env.PORT ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, safe);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
    await stat(file);
    return file;
  } catch {
    try { await stat(file + ".html"); return file + ".html"; } catch { return null; }
  }
}

createServer(async (req, res) => {
  const path = req.url ?? "/";
  // GitHub Pages redirects /en to /en/
  if (!extname(path.split("?")[0]) && !path.split("?")[0].endsWith("/")) {
    const dir = await resolveFile(path + "/");
    if (dir) { res.writeHead(301, { Location: path.split("?")[0] + "/" }); return res.end(); }
  }
  const file = await resolveFile(path);
  if (!file) {
    res.writeHead(404, { "Content-Type": types[".html"] });
    return res.end(await readFile(join(root, "404.html")).catch(() => "Not found"));
  }
  res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));
