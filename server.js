/* ============================================================
   UseSuno Downloader — backend proxy (zero dependencies)
   - serves the static site
   - GET /api/song?url=   : resolves a public Suno song's metadata
   - GET /api/media?url=  : streams a Suno media file (SSRF-protected)
   Bind 0.0.0.0 on PORT (default 3000). No npm install required.
   ============================================================ */
"use strict";
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const UPSTREAM_TIMEOUT = 20000;

/* ----- allowed hosts for the media proxy (SSRF protection) ----- */
const MEDIA_ALLOW = [
  "suno.com",
  "www.suno.com",
  "studio-api-prod.suno.com",
  "api.suno.ai",
];
function hostAllowed(host) {
  if (!host) return false;
  host = host.toLowerCase();
  if (MEDIA_ALLOW.includes(host)) return true;
  if (host.endsWith(".cloudfront.net")) return true;       // Suno's CDN
  if (host.endsWith(".suno.ai")) return true;              // Suno assets
  return false;
}

/* ----- tiny in-memory cache for song metadata ----- */
const metaCache = new Map();
const META_TTL = 5 * 60 * 1000;

/* ----- upstream fetch with redirects + timeout ----- */
function fetchUpstream(target, headers) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(target); } catch (e) { return reject(new Error("bad url")); }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return reject(new Error("bad protocol"));
    }
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      target,
      {
        method: "GET",
        headers: Object.assign(
          {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
            Accept: "text/html,application/json,audio/*,video/*,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          headers || {}
        ),
      },
      (res) => {
        const { statusCode, headers: h } = res;
        if (statusCode >= 300 && statusCode < 400 && h.location) {
          res.resume();
          const next = new URL(h.location, target).toString();
          return fetchUpstream(next, headers).then(resolve, reject);
        }
        if (statusCode !== 200) {
          res.resume();
          return reject(new Error("upstream_http_" + statusCode));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.setTimeout(UPSTREAM_TIMEOUT, () => {
      req.destroy(new Error("upstream_timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

/* ----- parse a Suno public page into song metadata ----- */
function metaOf(html) {
  const og = (name) => {
    let m = html.match(
      new RegExp(
        '<meta[^>]+(?:property|name)=["\']' + name + '["\'][^>]+content=["\']([^"\']*)',
        "i"
      )
    );
    if (m) return decodeEntities(m[1]);
    m = html.match(
      new RegExp(
        '<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']' + name + '["\']',
        "i"
      )
    );
    return m ? decodeEntities(m[1]) : null;
  };
  const field = (re) => {
    const m = html.match(re);
    return m ? m[1] : null;
  };

  const audioUrl = field(/"audioDownloadUrl"\s*:\s*"([^"]+)"/);
  const videoUrl = field(/"videoDownloadUrl"\s*:\s*"([^"]+)"/);
  const imageUrl = field(/"imageUrl"\s*:\s*"([^"]+)"/) || og("og:image");
  const title =
    og("og:title") ||
    field(/"title"\s*:\s*"([^"]{1,200})"/);
  const desc = og("og:description") || "";
  let creator = null;
  const byMatch = desc.match(/by\s+([^\s].+?)\s+on\s+suno/i);
  if (byMatch) creator = byMatch[1].trim();
  if (!creator) creator = field(/"displayName"\s*:\s*"([^"]+)"/);
  if (!creator) creator = field(/"handle"\s*:\s*"([^"]+)"/);

  let lyrics = field(/"lyrics"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (lyrics) lyrics = lyrics.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();

  const durMatch = field(/"duration"\s*:\s*(\d+(?:\.\d+)?)/);
  let duration = "—";
  if (durMatch) {
    const s = parseFloat(durMatch);
    if (isFinite(s)) {
      const m = Math.floor(s / 60);
      const sec = Math.round(s % 60);
      duration = m + ":" + (sec < 10 ? "0" : "") + sec;
    }
  }

  // Treat only directly-playable files as available (skip HLS .m3u8).
  const isDirect = (u) => u && !/\.m3u8(\?|$)/i.test(u);

  return {
    title: title ? title.trim() : null,
    creator: creator ? creator.trim() : null,
    cover: imageUrl || null,
    audio: !!isDirect(audioUrl),
    audioUrl: isDirect(audioUrl) ? audioUrl : null,
    video: !!isDirect(videoUrl),
    videoUrl: isDirect(videoUrl) ? videoUrl : null,
    lyrics: lyrics || "",
    duration,
  };
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* ----- validate + normalise a Suno link ----- */
function parseSunoId(input) {
  let text = (input || "").trim();
  if (!text) return null;
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(text) ? text : "https://" + text.replace(/^\/+/, ""));
  } catch (e) {
    return null;
  }
  const host = (u.hostname || "").replace(/^www\./, "").toLowerCase();
  if (host !== "suno.com") return null;
  const p = u.pathname.replace(/^\/+|\/+$/g, "");
  const m = p.match(/^(?:song|s|hook)\/(.+)$/i);
  if (!m) return null;
  const id = m[1].split(/[/?#]/)[0];
  return /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
}

/* ----- /api/song handler ----- */
async function handleSong(reqUrl, res) {
  const target = reqUrl.searchParams.get("url");
  const id = parseSunoId(target);
  if (!id) {
    return sendJSON(res, 400, { errorKey: "err_host" });
  }
  if (metaCache.has(id)) {
    const hit = metaCache.get(id);
    if (Date.now() < hit.expires) {
      return sendJSON(res, 200, Object.assign({ id }, hit.data));
    }
    metaCache.delete(id);
  }
  try {
    const pageUrl = "https://suno.com/s/" + id;
    const buf = await fetchUpstream(pageUrl);
    const html = buf.toString("utf8");
    const meta = metaOf(html);
    if (!meta.title) {
      return sendJSON(res, 404, { errorKey: "err_no_song" });
    }
    metaCache.set(id, { data: meta, expires: Date.now() + META_TTL });
    sendJSON(res, 200, Object.assign({ id }, meta));
  } catch (e) {
    const code = /timeout/.test(e.message) ? "err_timeout" : "err_unreachable";
    sendJSON(res, 502, { errorKey: code });
  }
}

/* ----- /api/media handler (SSRF-protected stream) ----- */
function handleMedia(reqUrl, res) {
  const target = reqUrl.searchParams.get("url");
  let u;
  try {
    u = new URL(target);
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ errorKey: "err_invalid" }));
  }
  if (!hostAllowed(u.hostname)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ errorKey: "err_host" }));
  }
  const lib = u.protocol === "https:" ? https : http;
  const req = lib.request(
    target,
    {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "*/*",
      },
    },
    (up) => {
      if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location) {
        up.resume();
        const next = new URL(up.headers.location, target).toString();
        res.writeHead(302, { Location: "/api/media?url=" + encodeURIComponent(next) });
        return res.end();
      }
      if (up.statusCode !== 200) {
        up.resume();
        res.writeHead(up.statusCode, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ errorKey: "err_unreachable" }));
      }
      res.writeHead(200, {
        "Content-Type": up.headers["content-type"] || "application/octet-stream",
        "Content-Length": up.headers["content-length"] || undefined,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      });
      up.pipe(res);
      up.on("error", () => { try { res.destroy(); } catch (_) {} });
    }
  );
  req.setTimeout(UPSTREAM_TIMEOUT, () => req.destroy(new Error("upstream_timeout")));
  req.on("error", (e) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ errorKey: "err_unreachable" }));
  });
  req.end();
}

/* ----- static file serving ----- */
const STATIC_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
function serveStatic(pathname, res) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  // prevent path traversal
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end("Forbidden");
  }
  // never expose backend / infra files to visitors
  const base = path.basename(filePath).toLowerCase();
  if (
    base === "server.js" || base === "package.json" || base === "package-lock.json" ||
    base.startsWith(".env") || base.endsWith(".log") || base === "readme.md"
  ) {
    res.writeHead(404); return res.end("Not found");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA-style fallback to index.html (only for genuinely missing assets)
      fs.readFile(path.join(ROOT, "index.html"), (e2, idx) => {
        if (e2) { res.writeHead(404); return res.end("Not found"); }
        res.writeHead(200, { "Content-Type": STATIC_TYPES[".html"] });
        res.end(idx);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": STATIC_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function sendJSON(res, status, obj) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(obj));
}

/* ----- router ----- */
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, "http://localhost");
  const p = reqUrl.pathname;
  if (p === "/api/song") return handleSong(reqUrl, res);
  if (p === "/api/media") return handleMedia(reqUrl, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" });
    return res.end();
  }
  return serveStatic(p, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("UseSuno downloader listening on http://0.0.0.0:" + PORT);
});
