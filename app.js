/* ============================================================
   UseSuno Downloader — replica client logic
   Mirrors the original tool:
     - URL validation (suno.com/song|s|hook/<id>, playlist, profile)
     - paste / example / submit flow
     - result panel (song hero, format chips, Download all)
     - audio format chooser (MP3 / WAV / original)
     - "Download all" ZIP (JSZip) + MP3 ID3 tagging
     - graceful demo mode + optional CORS-proxy hook
   ============================================================ */
(function () {
  "use strict";

  /* ---------- tiny DOM helpers ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var ZIP_URL = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
  var ID3_URL = "https://cdn.jsdelivr.net/npm/browser-id3-writer@4.4.0/dist/browser-id3-writer.min.js";

  /* ---------- element refs ---------- */
  var form = $("dl-form");
  var input = $("dl-input");
  var pasteBtn = $("dl-paste");
  var submitBtn = $("dl-submit");
  var exampleBtn = $("dl-example-try");
  var errorEl = $("dl-error");
  var results = $("dl-results");
  var coverImg = $("dl-cover");
  var titleEl = $("dl-title");
  var creatorEl = $("dl-creator");
  var detailsToggle = $("dl-details-toggle");
  var details = $("dl-details");
  var chips = $("dl-chips");
  var btnAll = $("dl-btn-all");
  var btnNew = $("dl-new");
  var statusEl = $("dl-status");

  var audioModal = $("dl-audio-modal");
  var playlistModal = $("dl-playlist-modal");
  var profileModal = $("dl-profile-modal");

  var state = { song: null, proxy: localStorage.getItem("usesuno-proxy") || "" };

  /* ============================================================
     VALIDATION  (matches the original's supported-link rules)
     ============================================================ */
  function validateLink(raw) {
    var text = (raw || "").trim();
    if (!text) {
      return { ok: false, key: "err_empty" };
    }
    var url;
    try {
      // accept bare paths / missing scheme
      url = new URL(/^https?:\/\//i.test(text) ? text : "https://" + text.replace(/^\/+/, ""));
    } catch (e) {
      return { ok: false, key: "err_invalid" };
    }

    var host = (url.hostname || "").replace(/^www\./, "").toLowerCase();
    if (host !== "suno.com") {
      return { ok: false, key: "err_host" };
    }

    var path = url.pathname.replace(/^\/+|\/+$/g, "");
    var m;

    if (/^(?:song|s|hook)$/i.test(path)) {
      return { ok: false, key: "err_missing_id_generic" };
    }
    if ((m = path.match(/^(?:song|s)\/(.+)$/i))) {
      var id = sanitizeId(m[1]);
      if (!id) return { ok: false, key: "err_missing_song_id" };
      return { ok: true, kind: "song", id: id };
    }
    if ((m = path.match(/^hook\/(.+)$/i))) {
      var hid = sanitizeId(m[1]);
      if (!hid) return { ok: false, key: "err_missing_hook_id" };
      return { ok: true, kind: "hook", id: hid };
    }
    if (/^playlist/i.test(path) || /[?&]playlist/i.test(url.search)) {
      return { ok: true, kind: "playlist" };
    }
    if (/^@/.test(path) || /^profile\b/i.test(path)) {
      return { ok: true, kind: "profile" };
    }
    return { ok: false, key: "err_unsupported" };
  }

  function sanitizeId(seg) {
    // strip any trailing query/hash/fragment already removed; keep alnum + _ -
    var id = seg.split(/[/?#]/)[0];
    if (/^[A-Za-z0-9_-]{6,}$/.test(id)) return id;
    return "";
  }

  /* ============================================================
     PROXY / FETCH
     ============================================================ */
  function resolveUrl(target) {
    if (!state.proxy) return target;
    var p = state.proxy;
    if (/\?url=$/.test(p)) return p + encodeURIComponent(target);      // user already supplied ?url=
    if (p.indexOf("?") === -1) return p + "?url=" + encodeURIComponent(target);
    return p + "&url=" + encodeURIComponent(target);
  }

  async function fetchText(target) {
    var res = await fetch(resolveUrl(target), { mode: state.proxy ? "cors" : "cors", credentials: "omit" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.text();
  }

  /* ============================================================
     RESOLVE A SONG  (real metadata when a proxy is set;
                      demo object otherwise)
     ============================================================ */
  /* ---------- map backend metadata -> song object ---------- */
  function mapBackendSong(d, id) {
    return {
      demo: false,
      id: id,
      title: d.title || ("Suno song " + id),
      creator: d.creator || "Unknown creator",
      cover: d.cover || demoCover(id),
      audio: !!d.audio,
      audioUrl: d.audioUrl || null,
      video: !!d.video,
      videoUrl: d.videoUrl || null,
      lyrics: d.lyrics || "",
      duration: d.duration || "—",
      source: "suno.com"
    };
  }

  function makeDemoSong(id, warn) {
    return {
      demo: true,
      id: id,
      title: "Suno song " + id,
      creator: "demo · run the node server for real files",
      cover: demoCover(id),
      duration: "0:30",
      audio: true,
      video: true,
      lyrics: true,
      source: "Demonstration mode",
      warn: warn || null
    };
  }

  /* ---------- primary path: bundled Node backend ---------- */
  async function fetchSongMeta(id) {
    var url = "/api/song?url=" + encodeURIComponent("https://suno.com/s/" + id);
    var res = await fetch(url, { credentials: "omit" });
    var data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (data.errorKey) throw new Error(data.errorKey);
    if (!res.ok) throw new Error("err_load");
    return mapBackendSong(data, id);
  }

  async function resolveSong(id) {
    // 1) Primary: bundled Node backend (real CORS-free downloads on the public web).
    try {
      return await fetchSongMeta(id);
    } catch (e) {
      var key = e.message;
      // Definitive backend answers meaning "no real song" -> surface as errors.
      if (key === "err_host" || key === "err_no_song") throw new Error(key);
      // Backend unreachable / timed out / not present -> graceful demo fallback.
      // 2) Optional: a user-configured CORS proxy (manual path).
      if (state.proxy) {
        try {
          var html = await fetchText("https://suno.com/s/" + id);
          var s = parseSunoPage(html, id);
          if (s.title) return s;
        } catch (e2) { /* fall through */ }
      }
      return makeDemoSong(id, key);
    }
  }

  function parseSunoPage(html, id) {
    var title = meta(html, "og:title") || meta(html, "twitter:title") || pick(html, /"title"\s*:\s*"([^"]{1,120})"/);
    var image = meta(html, "og:image") || pick(html, /"imageUrl"\s*:\s*"([^"]+)"/) || pick(html, /"image"\s*:\s*"([^"]+)"/);
    var creator = meta(html, "og:description")
      ? (meta(html, "og:description").match(/by\s+([^\s].+?)(?:\s+on\s|$)/i) || [])[1]
      : pick(html, /"displayName"\s*:\s*"([^"]+)"/);
    var audio = pick(html, /"audioDownloadUrl"\s*:\s*"([^"]+)"/) || pick(html, /"audio_url"\s*:\s*"([^"]+)"/);
    var video = pick(html, /"videoDownloadUrl"\s*:\s*"([^"]+)"/) || pick(html, /"video_url"\s*:\s*"([^"]+)"/);
    var lyrics = pick(html, /"lyrics"\s*:\s*"((?:[^"\\]|\\.){0,4000})"/);
    var duration = pick(html, /"duration"\s*:\s*"?(\d+(?:\.\d+)?)/);
    if (lyrics) lyrics = lyrics.replace(/\\n/g, "\n").replace(/\\"/g, '"');
    return {
      demo: false,
      id: id,
      title: clean(title) || ("Suno song " + id),
      creator: clean(creator) || "Unknown creator",
      cover: image || demoCover(id),
      audio: !!audio,
      audioUrl: audio,
      video: !!video,
      videoUrl: video,
      lyrics: lyrics || "",
      duration: duration ? fmtDur(parseFloat(duration)) : "—",
      source: "suno.com"
    };
  }

  function meta(html, name) {
    var m = html.match(new RegExp('<meta[^>]+property=["\']' + name + '["\'][^>]+content=["\']([^"\']+)', "i"))
        || html.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' + name + '["\']', "i"));
    return m ? m[1] : null;
  }
  function pick(html, re) { var m = html.match(re); return m ? m[1] : null; }
  function clean(s) { return (s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(); }
  function fmtDur(s) {
    if (!isFinite(s)) return "—";
    var m = Math.floor(s / 60), sec = Math.round(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function demoCover(id) {
    var c = document.createElement("canvas");
    c.width = c.height = 240;
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 0, 240, 240);
    g.addColorStop(0, "#4d963b"); g.addColorStop(1, "#2f6f45");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 240, 240);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 26px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Suno", 120, 120);
    ctx.font = "600 15px sans-serif";
    ctx.fillText(id.slice(0, 14), 120, 150);
    return c.toDataURL("image/png");
  }

  /* ============================================================
     RENDER RESULT PANEL
     ============================================================ */
  function renderResult(song) {
    state.song = song;
    coverImg.src = song.cover;
    titleEl.textContent = song.title;
    creatorEl.textContent = song.creator || "—";
    $("dl-detail-format").textContent = song.video ? "Audio + MP4" : "Audio";
    $("dl-detail-duration").textContent = song.duration || "—";
    $("dl-detail-source").textContent = song.source || "—";

    setChip("audio", !!song.audio);
    setChip("mp4", !!song.video);
    setChip("cover", !!song.cover);
    setChip("lyrics", true);

    details.hidden = true;
    detailsToggle.setAttribute("aria-expanded", "false");
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setStatus("");
  }

  function setChip(kind, available) {
    var el = chips.querySelector('[data-kind="' + kind + '"]');
    if (el) el.disabled = !available;
  }

  /* ============================================================
     DOWNLOAD PIPELINE
     ============================================================ */
  function safeName(title) {
    var t = (title || "download").replace(/[\/\\:*?"<>|]/g, "_").trim().replace(/[. ]+$/g, "");
    return (t.slice(0, 180) || "download") + " - usesuno.com";
  }

  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* media bytes: backend /api/media by default, optional user proxy otherwise */
  async function fetchMediaBytes(mediaUrl) {
    var target = state.proxy
      ? resolveUrl(mediaUrl)
      : ("/api/media?url=" + encodeURIComponent(mediaUrl));
    var res = await fetch(target, { mode: "cors", credentials: "omit" });
    var data = {};
    if (!res.ok) {
      try { data = await res.json(); } catch (e) { data = {}; }
      throw new Error(data.errorKey || ("HTTP " + res.status));
    }
    var blob = await res.blob();
    if (!blob.size) throw new Error("Empty file");
    return blob;
  }

  /* ---- audio: mp3 (tagged), wav (decode), original (pass-through) ---- */
  async function produceAudio(format) {
    var song = state.song;
    if (song.demo) return demoAudio(format);

    var blob = await fetchMediaBytes(song.audioUrl);
    if (format === "original") return { blob: blob, ext: extFrom(blob.type, "mp3") };
    if (format === "wav") {
      var wav = await decodeToWav(blob);
      return { blob: wav, ext: "wav" };
    }
    // mp3 + tags
    if (window.ID3Writer) {
      try { blob = await tagMp3(blob, song); } catch (e) { /* keep untagged */ }
    }
    return { blob: blob, ext: "mp3" };
  }

  function extFrom(type, fallback) {
    if (/mpeg|mp3/i.test(type)) return "mp3";
    if (/wav/i.test(type)) return "wav";
    if (/mp4|quicktime/i.test(type)) return "mp4";
    if (/png/i.test(type)) return "png";
    if (/jpeg|jpg/i.test(type)) return "jpg";
    return fallback;
  }

  async function decodeToWav(blob) {
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = new AC();
    var buf = await blob.arrayBuffer();
    var audio = await ctx.decodeAudioData(buf);
    return encodeWav(audio);
  }

  function encodeWav(audioBuffer) {
    var numCh = audioBuffer.numberOfChannels;
    var sr = audioBuffer.sampleRate;
    var len = audioBuffer.length * numCh * 2 + 44;
    var ab = new ArrayBuffer(len);
    var view = new DataView(ab);
    function ws(off, s) { for (var i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
    ws(0, "RIFF"); view.setUint32(4, len - 8, true); ws(8, "WAVE");
    ws(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
    view.setUint32(28, sr * numCh * 2, true); view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true); ws(36, "data"); view.setUint32(40, len - 44, true);
    var off = 44;
    for (var i = 0; i < audioBuffer.length; i++) {
      for (var c = 0; c < numCh; c++) {
        var s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(c)[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2;
      }
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  async function tagMp3(mp3Blob, song) {
    if (!window.ID3Writer) {
      await loadScript(ID3_URL, function () { return typeof window.ID3Writer === "function"; });
    }
    var Writer = window.ID3Writer;
    var buf = await mp3Blob.arrayBuffer();
    var w = new Writer(new Uint8Array(buf));
    w.setFrame("TIT2", song.title || "");
    if (song.creator) { w.setFrame("TPE1", [song.creator]); w.setFrame("TPE2", [song.creator]); w.setFrame("TCOM", [song.creator]); w.setFrame("TEXT", [song.creator]); }
    w.setFrame("TALB", "Suno AI");
    if (song.lyrics) w.setFrame("USLT", { language: "eng", description: "", lyrics: song.lyrics });
    w.addTag();
    var out = w.getBlob();
    return out instanceof Blob ? out : new Blob([out], { type: "audio/mpeg" });
  }

  function demoAudio(format) {
    if (format === "wav" || format === "original") {
      // 0.4s silent WAV so the audio path is real and testable
      var sr = 44100, dur = 0.4, n = Math.floor(sr * dur);
      var ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
      function ws(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
      ws(0, "RIFF"); v.setUint32(4, ab.byteLength - 8, true); ws(8, "WAVE");
      ws(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
      v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, "data"); v.setUint32(40, n * 2, true);
      return Promise.resolve({ blob: new Blob([ab], { type: "audio/wav" }), ext: format === "original" ? "wav" : "wav" });
    }
    // demo mp3: a tiny silent MP3 frame container (taggable)
    var silence = base64ToBytes(
      "SUQzBAADTgAASUQzBAAAAAABFRTMoUrvAAAAAAAAAAAAAAAAAA//" +
      "tgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    );
    return Promise.resolve({ blob: new Blob([silence], { type: "audio/mpeg" }), ext: "mp3" });
  }

  /* ---- cover ---- */
  async function produceCover() {
    var song = state.song;
    if (song.demo) {
      var res = await fetch(song.cover); return { blob: await res.blob(), ext: "png" };
    }
    var blob = await fetchMediaBytes(song.cover);
    return { blob: blob, ext: extFrom(blob.type, "jpg") };
  }

  /* ---- lyrics ---- */
  function produceLyrics() {
    var song = state.song;
    var text = (song.lyrics && song.lyrics.trim()) || "(No lyrics were available for this song.)";
    return { blob: new Blob([text], { type: "text/plain" }), ext: "txt" };
  }

  /* ---- mp4 ---- */
  async function produceMp4() {
    var song = state.song;
    if (song.demo) {
      // tiny placeholder mp4 (1x1) so the download/ZIP flow is exercisable
      var b = base64ToBytes(
        "AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmZGhyAAAAAABtaWR4AAAA" +
        "AAAAAAAAbWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAbWlucfAAAAAEAAAAAAAEAAAE" +
        "AAAAAAAAAAAAAAAAAAAAAAA=");
      return { blob: new Blob([b], { type: "video/mp4" }), ext: "mp4" };
    }
    var blob = await fetchMediaBytes(song.videoUrl);
    return { blob: blob, ext: extFrom(blob.type, "mp4") };
  }

  /* ============================================================
     ZAPI (Download all)
     ============================================================ */
  async function loadZip() {
    if (window.JSZip) return window.JSZip;
    await loadScript(ZIP_URL, function () { return typeof window.JSZip === "function"; });
    return window.JSZip;
  }

  async function downloadAll() {
    if (!state.song) return;
    setStatus(t("status_zip"), true);
    var JSZip = await loadZip();
    var zip = new JSZip();
    var base = safeName(state.song.title);
    var jobs = [];
    if (state.song.audio) jobs.push(["audio-mp3", produceAudio("mp3")]);
    if (state.song.video) jobs.push(["video", produceMp4()]);
    if (state.song.cover) jobs.push(["cover", produceCover()]);
    jobs.push(["lyrics", Promise.resolve(produceLyrics())]);

    for (var i = 0; i < jobs.length; i++) {
      try {
        var out = await jobs[i][1];
        zip.file(base + "." + out.ext, out.blob);
      } catch (e) { /* skip unavailable */ }
    }
    var content = await zip.generateAsync({ type: "blob" });
    saveBlob(content, base + ".zip");
    setStatus(t("status_zip_saved"));
  }

  /* ============================================================
     STATUS / ERROR
     ============================================================ */
  function setStatus(msg, busy) {
    if (!msg) { statusEl.hidden = true; statusEl.className = "dl-status"; return; }
    statusEl.hidden = false;
    statusEl.textContent = msg;
    statusEl.className = "dl-status" + (busy ? " busy" : "");
  }
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    input.classList.add("invalid");
  }
  function clearError() {
    errorEl.hidden = true;
    input.classList.remove("invalid");
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */
  async function doSubmit() {
    clearError();
    var v = validateLink(input.value);
    if (!v.ok) { showError(t(v.key)); return; }

    if (v.kind === "playlist") { openModal(playlistModal); return; }
    if (v.kind === "profile") { openModal(profileModal); return; }

    submitBtn.disabled = true;
    setStatus(t("status_loading"), true);
    try {
      var song = await resolveSong(v.id);
      renderResult(song);
      if (song.demo) setStatus(song.warn ? t("status_demo_fallback") : t("status_demo"));
    } catch (e) {
      showError(t(e.message || "err_load"));
      setStatus("");
    } finally {
      submitBtn.disabled = false;
    }
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); doSubmit(); });
  input.addEventListener("input", clearError);

  pasteBtn.addEventListener("click", async function () {
    try {
      var text = await navigator.clipboard.readText();
      input.value = text;
      clearError();
      input.focus();
    } catch (e) {
      input.focus();
    }
  });

  exampleBtn.addEventListener("click", function () {
    input.value = "https://suno.com/s/kuuNnXWLBeiaN1wU";
    clearError();
    doSubmit();
  });

  btnNew.addEventListener("click", function () {
    results.hidden = true;
    input.value = "";
    state.song = null;
    setStatus("");
    input.focus();
  });

  detailsToggle.addEventListener("click", function () {
    var open = details.hidden;
    details.hidden = !open;
    detailsToggle.setAttribute("aria-expanded", String(open));
  });

  /* chip clicks */
  chips.addEventListener("click", function (e) {
    var chip = e.target.closest(".dl-chip");
    if (!chip || chip.disabled) return;
    var kind = chip.getAttribute("data-kind");
    if (kind === "audio") { openModal(audioModal); }
    else if (kind === "mp4") { runDownload(produceMp4, "video"); }
    else if (kind === "cover") { runDownload(produceCover, "cover"); }
    else if (kind === "lyrics") { runDownload(produceLyrics, "lyrics"); }
  });

  btnAll.addEventListener("click", downloadAll);

  /* audio format chooser */
  audioModal.addEventListener("click", function (e) {
    var choice = e.target.closest(".dl-audio-format-choice");
    if (choice) {
      var fmt = choice.getAttribute("data-audio-format-choice");
      closeModal(audioModal);
      runDownload(function () { return produceAudio(fmt); }, "audio-" + fmt);
    }
    if (e.target.closest("#dl-audio-format-close") || e.target === audioModal) closeModal(audioModal);
  });

  function runDownload(producer, label) {
    setStatus(t("status_preparing"), true);
    Promise.resolve(producer()).then(function (out) {
      var base = safeName(state.song.title);
      saveBlob(out.blob, base + "." + out.ext);
      setStatus(t("status_saved") + " " + base + "." + out.ext);
    }).catch(function (err) {
      setStatus("");
      showError(t("err_download"));
    });
  }

  /* modal helpers */
  function openModal(m) { if (typeof m.showModal === "function") m.showModal(); else m.setAttribute("open", ""); }
  function closeModal(m) { if (typeof m.close === "function") m.close(); else m.removeAttribute("open"); }

  $("dl-audio-format-close").addEventListener("click", function () { closeModal(audioModal); });
  $("dl-playlist-modal-close").addEventListener("click", function () { closeModal(playlistModal); });
  $("dl-profile-modal-close").addEventListener("click", function () { closeModal(profileModal); });
  $("dl-stay-song").addEventListener("click", function () { closeModal(playlistModal); });
  $("dl-stay-song-profile").addEventListener("click", function () { closeModal(profileModal); });
  [playlistModal, profileModal].forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m) closeModal(m); });
  });

  /* optional proxy setting */
  var proxyInput = $("dl-proxy"), proxySave = $("dl-proxy-save"), proxyNote = $("dl-proxy-note");
  proxyInput.value = state.proxy;
  proxySave.addEventListener("click", function () {
    state.proxy = proxyInput.value.trim();
    if (state.proxy) localStorage.setItem("usesuno-proxy", state.proxy);
    else localStorage.removeItem("usesuno-proxy");
    proxyNote.hidden = false;
    proxyNote.textContent = state.proxy ? t("proxy_saved") : t("proxy_cleared");
  });

  /* nav toggle (mobile) */
  var navToggle = $("nav-toggle"), navLinks = $("nav-links");
  if (navToggle) navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  /* ---------- util ---------- */
  function loadScript(src, ready) {
    return new Promise(function (resolve, reject) {
      if (ready && ready()) return resolve();
      var s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = function () { ready && ready() ? resolve() : reject(new Error("dep invalid")); };
      s.onerror = function () { reject(new Error("dep load failed")); };
      document.head.appendChild(s);
    });
  }
  function base64ToBytes(b64) {
    var bin = atob(b64); var len = bin.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
})();
