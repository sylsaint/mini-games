import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { root } from "./build.mjs";
const base = path.join(root, "dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      let target = path.resolve(
        base,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
      if (!target.startsWith(base + path.sep) && target !== base)
        throw Error("Invalid path");
      if ((await stat(target)).isDirectory())
        target = path.join(target, "index.html");
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(target)] || "application/octet-stream",
      });
      res.end(await readFile(target));
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
    console.log("http://127.0.0.1:" + (process.env.PORT || 4173)),
  );
