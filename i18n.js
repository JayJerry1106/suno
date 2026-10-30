/* ============================================================
   UseSuno Downloader — internationalization (en / zh)
   Dictionaries + applyLang() + t() helper + language switcher
   ============================================================ */
(function () {
  "use strict";

  var I18N = {
    en: {
      /* nav */
      nav_guide: "Guide hub",
      nav_styles: "Style library",
      nav_tools: "Tools",
      nav_extension: "Extension",

      /* hero */
      eyebrow: "Download tool",
      h1: "Free Suno Song Downloader",
      lede: "Download any public Suno song or Hook as MP3, WAV, original audio, MP4 video or cover art. Decryption and optional conversion complete in your browser.",

      /* form */
      form_label: "Suno song or Hook link",
      form_placeholder: "Paste a Suno link — suno.com/song/…, suno.com/s/… or suno.com/hook/…",
      form_hint: 'A supported link normally starts with <code>suno.com/song/…</code>, <code>suno.com/s/…</code> or <code>suno.com/hook/…</code>.',
      btn_paste: "Paste",
      btn_submit: "Find download options",
      btn_example: "Try an example",

      /* result panel */
      song_details: "Song details",
      detail_format: "Format",
      detail_duration: "Duration",
      detail_source: "Source",
      chip_audio: "Audio",
      chip_audio_sub: "MP3 · WAV · original",
      chip_mp4: "MP4 video",
      chip_mp4_sub: "Published song video",
      chip_cover: "Cover art",
      chip_cover_sub: "JPEG image",
      chip_lyrics: "Lyrics",
      chip_lyrics_sub: "Text file",
      btn_all: "Download all (ZIP)",
      btn_new: "New link",

      /* content — headings */
      c_own_title: "Suno AI downloader for your own songs",
      c_url_title: "How to get a Suno song URL",
      c_fit_title: "Which Suno download fits your task?",
      c_steps_title: "Download a Suno song in three steps",
      c_devices_title: "Downloading on desktop and mobile",
      c_desktop_title: "Desktop browser",
      c_newtab_title: "Why a download may open in a new tab",
      c_official_title: "Official Suno downloads and this public-link tool",
      c_what_title: "What you can download and how you can use it",
      c_limits_title: "Current limits and unsupported formats",
      c_privacy_title: "Privacy",
      c_respect_title: "Respectful use",

      /* content — paragraphs (may contain HTML) */
      c_own_p1: "UseSuno is a free Suno AI downloader for saving your own publicly accessible songs or Hooks as MP3, WAV or original audio. You can also save available MP4 video, cover art and lyrics without signing in to usesuno or installing an app. Files are fetched from Suno or its CDN and saved locally by your browser. <strong>Only download content you own or have permission to save.</strong>",
      c_own_p2: "Need to save more than one song? Use the <a href=\"#tools\">batch downloader</a> for selected links, or try the <a href=\"#tools\">Suno playlist downloader</a>. Need a current backup plan? Read the <a href=\"#guide\">Suno download policy update</a> for Free, Pro, Premier and Studio limits, older songs and the official download route.",
      c_url_p: "Open the public song on Suno, then copy its URL from the browser address bar or Suno's share control. A supported link normally starts with <code>suno.com/song/…</code>, <code>suno.com/s/…</code> or <code>suno.com/hook/…</code>. Paste the complete link above rather than a song title or creator name.",
      c_fit_p: "The downloader reads one public Suno song or Hook link and shows only the files available for that item. Choose one file or use <strong>Download all</strong> to build a ZIP in your browser.",
      c_fit_card1_t: "MP3, WAV or original audio",
      c_fit_card1_p: "MP3 works in most players and includes available song information. Choose WAV when an editor needs uncompressed PCM, or choose original audio for the fastest path without transcoding. Decryption and optional conversion happen locally. A converted WAV provides editing compatibility; it cannot restore detail already missing from the source audio of your AI-generated song. Not sure which file fits your next step? Compare Suno audio and video formats.",
      c_fit_card2_t: "MP4 video",
      c_fit_card2_p: "Choose MP4 when you need the published song video for offline viewing or an authorized video workflow. The option remains unavailable when Suno exposes audio but no video file for that song.",
      c_fit_card3_t: "JPEG cover art",
      c_fit_card3_p: "Save the square cover image at its native resolution for artwork, playlists or sharing.",
      c_fit_card4_t: "Lyrics or ZIP",
      c_fit_card4_p: "Copy the lyrics as plain text, or bundle every available file into one ZIP your browser assembles locally.",
      c_steps_l1_s: "Paste the link above and load the song.",
      c_steps_l1_p: "Check the title and cover before saving a file.",
      c_steps_l2_s: "Choose a format.",
      c_steps_l2_p: "Pick Audio to pick MP3, WAV or original, or grab MP4, cover art or lyrics directly.",
      c_steps_l3_s: "Save the file.",
      c_steps_l3_p: "Your browser downloads it locally — or use Download all to pack everything into a ZIP.",
      c_desktop_p: "On a desktop browser the file saves straight to your Downloads folder. Larger songs and ZIP bundles may take a moment while your browser fetches the asset and, for audio, decrypts and optionally converts it locally.",
      c_newtab_p: "Some browsers hand certain media types to a built-in player instead of saving them. If that happens, use the player's own save or download control, or right-click the link and choose “Save as”. This is normal browser behavior and does not affect the file you receive.",
      c_official_p: "Suno offers its own in-app download for songs you created. This tool is an independent, unofficial companion that reads a public share link you already have access to. Use the official route when it fits; use this tool when you need a quick local copy of a public link without signing in.",
      c_what_p: "You can download a public song or Hook you own or have permission to save. Keep personal backups, move files between devices, or feed editable formats into your own projects. Respect creator rights and Suno's terms when you share anything further.",
      c_limits_p: "The tool shows only files Suno exposes for a given public link. Private or removed songs, region-restricted items, and formats Suno does not publish will appear as unavailable. Very large playlists may be better handled by the batch or playlist downloader.",
      c_privacy_p: "Your link is processed in your browser. Where a fetch proxy is configured, only the minimum request needed to reach Suno is sent; song IDs and links are not stored or sent to analytics beyond anonymized, aggregated counts.",
      c_respect_p: "Download only what you own or are allowed to save. Don't redistribute other creators' work without permission, and don't use the tool to circumvent Suno's own limits. The tool is for personal backup and authorized workflows.",

      /* sponsor / footer */
      sponsor_label: "Sponsored by",
      footer: "UseSuno is an independent, unofficial Suno companion. Suno and related names belong to their owners. Not affiliated with Suno.",

      /* modals */
      m_audio_title: "Choose audio format",
      m_audio_sub: "Pick how you want the song audio saved.",
      m_audio_mp3: "MP3",
      m_audio_mp3_sub: "Compact, plays everywhere, includes song info",
      m_audio_wav: "WAV",
      m_audio_wav_sub: "Uncompressed PCM for editing",
      m_audio_original: "Original",
      m_audio_original_sub: "Fastest path, no transcoding",
      m_playlist_title: "That looks like a playlist link",
      m_playlist_sub: "This downloader handles one song or Hook at a time. Open it as a single song, or use the playlist downloader for the whole list.",
      m_playlist_btn: "Stay on this song",
      m_profile_title: "That looks like a profile link",
      m_profile_sub: "This downloader reads one song at a time. Use the profile downloader to analyze a creator's songs and save available MP3s or a ZIP.",
      m_profile_btn: "Stay here",

      /* proxy settings */
      proxy_summary: "Advanced: media fetch proxy (optional)",
      proxy_p: "Real downloads are served by the bundled Node backend (<code>/api/song</code> + <code>/api/media</code>), so a public deployment fetches real Suno files with no extra setup. If you host the static files on their own, set a CORS proxy here that forwards to Suno (for example <code>https://your-proxy.example/?url=</code>) to keep downloads working. Leave empty to use the bundled backend, or fall back to demonstration mode.",
      proxy_save: "Save",
      proxy_saved: "Proxy saved. Real Suno files will be fetched through it.",
      proxy_cleared: "Proxy cleared. Running in demonstration mode.",
      proxy_placeholder: "https://your-proxy.example/?url=",

      /* meta */
      meta_desc: "Free Suno song downloader. Download any public Suno song or Hook as MP3, WAV, original audio, MP4 video or cover art. Decryption and optional conversion complete in your browser.",
      meta_title: "Suno Downloader — Download Suno Songs as MP3 & MP4",

      /* dynamic status / errors */
      status_loading: "Loading song…",
      status_zip: "Building ZIP…",
      status_zip_saved: "ZIP saved.",
      status_saved: "Saved",
      status_preparing: "Preparing download…",
      status_demo: "Demonstration mode — run the included Node server (or set a media proxy below) to fetch real Suno files. The full flow is interactive.",
      status_demo_fallback: "Couldn't reach the download server — showing demonstration mode. Deploy the included Node server for real downloads.",
      err_empty: "Paste a Suno link first.",
      err_invalid: "That doesn't look like a valid link. Use a full Suno URL.",
      err_host: "That doesn't look like a Suno link. Use suno.com/song/…, suno.com/s/… or suno.com/hook/…",
      err_missing_id_generic: "The link is missing its song or Hook ID.",
      err_missing_song_id: "The song link is missing its song ID.",
      err_missing_hook_id: "The Hook link is missing its ID.",
      err_unsupported: "Unsupported Suno link. Use a song, Hook, playlist or profile URL from suno.com.",
      err_load: "Couldn't load that link. Check it is a public Suno song and your proxy is reachable.",
      err_no_song: "Found the page but no playable song. The link may be private, removed, or region-restricted.",
      err_download: "Download failed. Try again or check your proxy.",
      err_timeout: "The request timed out. Please retry.",
      err_unreachable: "Couldn't reach Suno. Check the link is a public song or try again later.",

      /* lang switcher */
      lang_label: "Language"
    },

    zh: {
      nav_guide: "使用指南",
      nav_styles: "风格库",
      nav_tools: "工具",
      nav_extension: "扩展",

      eyebrow: "下载工具",
      h1: "免费 Suno 歌曲下载器",
      lede: "将任何公开的 Suno 歌曲或 Hook 下载为 MP3、WAV、原始音频、MP4 视频或封面图。解密与可选的格式转换都在你的浏览器中完成。",

      form_label: "Suno 歌曲或 Hook 链接",
      form_placeholder: "粘贴 Suno 链接 —— suno.com/song/…、suno.com/s/… 或 suno.com/hook/…",
      form_hint: "受支持的链接通常以 <code>suno.com/song/…</code>、<code>suno.com/s/…</code> 或 <code>suno.com/hook/…</code> 开头。",
      btn_paste: "粘贴",
      btn_submit: "查找下载选项",
      btn_example: "试试示例",

      song_details: "歌曲详情",
      detail_format: "格式",
      detail_duration: "时长",
      detail_source: "来源",
      chip_audio: "音频",
      chip_audio_sub: "MP3 · WAV · 原始",
      chip_mp4: "MP4 视频",
      chip_mp4_sub: "已发布的歌曲视频",
      chip_cover: "封面图",
      chip_cover_sub: "JPEG 图片",
      chip_lyrics: "歌词",
      chip_lyrics_sub: "文本文件",
      btn_all: "全部下载 (ZIP)",
      btn_new: "新链接",

      c_own_title: "用 Suno AI 下载器保存你自己的歌曲",
      c_url_title: "如何获取 Suno 歌曲链接",
      c_fit_title: "哪种 Suno 下载适合你的需求？",
      c_steps_title: "三步下载一首 Suno 歌曲",
      c_devices_title: "在桌面端与移动端下载",
      c_desktop_title: "桌面浏览器",
      c_newtab_title: "为何下载可能在新标签页中打开",
      c_official_title: "Suno 官方下载与本公开链接工具",
      c_what_title: "你可以下载什么以及如何合理使用",
      c_limits_title: "当前限制与不支持的格式",
      c_privacy_title: "隐私",
      c_respect_title: "合理使用",

      c_own_p1: "UseSuno 是一个免费的 Suno AI 下载器，可将你自己公开可访问的歌曲或 Hook 保存为 MP3、WAV 或原始音频。你也可以在无需登录 usesuno 或安装应用的情况下，保存可用的 MP4 视频、封面图和歌词。文件从 Suno 或其 CDN 获取，并由你的浏览器本地保存。<strong>请仅下载你拥有或获授权保存的内容。</strong>",
      c_own_p2: "需要保存多首歌曲？可使用<a href=\"#tools\">批量下载器</a>处理所选链接，或试试 <a href=\"#tools\">Suno 歌单下载器</a>。需要一个当前的备份方案？阅读 <a href=\"#guide\">Suno 下载政策更新</a>，了解 Free、Pro、Premier 和 Studio 的限额、旧歌曲以及官方下载途径。",
      c_url_p: "在 Suno 上打开公开歌曲，然后从浏览器地址栏或 Suno 的分享控件复制其链接。受支持的链接通常以 <code>suno.com/song/…</code>、<code>suno.com/s/…</code> 或 <code>suno.com/hook/…</code> 开头。请粘贴完整链接，而不是歌曲标题或创作者名称。",
      c_fit_p: "下载器读取一个公开的 Suno 歌曲或 Hook 链接，并仅显示该条目可用的文件。选择单个文件，或使用<strong>全部下载</strong>在浏览器中打包成 ZIP。",
      c_fit_card1_t: "MP3、WAV 或原始音频",
      c_fit_card1_p: "MP3 在大多数播放器中都能播放，并包含可用的歌曲信息。当剪辑软件需要无损 PCM 时选择 WAV；或选择原始音频以获得最快、无需转码的路径。解密与可选的格式转换都在本地完成。转换后的 WAV 可提供剪辑兼容性，但无法还原 AI 生成歌曲源音频中已缺失的细节。不确定下一步该选哪种文件？对比一下 Suno 音频与视频格式。",
      c_fit_card2_t: "MP4 视频",
      c_fit_card2_p: "当你需要已发布的歌曲视频用于离线观看或授权视频流程时，选择 MP4。当 Suno 仅提供音频而未提供视频文件时，该选项将不可用。",
      c_fit_card3_t: "JPEG 封面图",
      c_fit_card3_p: "以原始分辨率保存方形封面图，用于封面、歌单或分享。",
      c_fit_card4_t: "歌词或 ZIP",
      c_fit_card4_p: "将歌词复制为纯文本，或将所有可用文件打包成一个由浏览器在本地组装的 ZIP。",
      c_steps_l1_s: "在上方粘贴链接并加载歌曲。",
      c_steps_l1_p: "保存文件前先核对标题与封面。",
      c_steps_l2_s: "选择格式。",
      c_steps_l2_p: "点击“音频”可选择 MP3、WAV 或原始音频，或直接获取 MP4、封面图或歌词。",
      c_steps_l3_s: "保存文件。",
      c_steps_l3_p: "你的浏览器会将其下载到本地——或使用“全部下载”将所有内容打包成 ZIP。",
      c_desktop_p: "在桌面浏览器中，文件会直接保存到你的“下载”文件夹。较大的歌曲与 ZIP 包可能需要稍等片刻，因为浏览器要获取资源，并在音频情况下于本地解密、可选转码。",
      c_newtab_p: "某些浏览器会把特定媒体类型交给内置播放器，而不是直接保存。如果发生这种情况，请使用播放器自身的保存或下载控件，或右键点击链接并选择“另存为”。这是正常的浏览器行为，不会影响你收到的文件。",
      c_official_p: "Suno 为其创作的歌曲提供应用内下载。本工具是一个独立、非官方的辅助工具，读取你已有权访问的公开分享链接。适合时请使用官方途径；当你需要无需登录即可快速本地保存公开链接时，可使用本工具。",
      c_what_p: "你可以下载你拥有或获授权保存的公开歌曲或 Hook。可用于个人备份、跨设备转移，或将可编辑格式用于你自己的项目。在进一步分享时，请尊重创作者权益与 Suno 的服务条款。",
      c_limits_p: "本工具仅显示 Suno 针对该公开链接所暴露的文件。私密或已删除的歌曲、受地区限制的内容，以及 Suno 未发布的格式将显示为不可用。非常大的歌单更适合使用批量或歌单下载器处理。",
      c_privacy_p: "你的链接在浏览器中处理。当配置了抓取代理时，仅发送访问 Suno 所需的最小请求；除匿名化、聚合的计数外，歌曲 ID 与链接不会被存储或发送给分析服务。",
      c_respect_p: "仅下载你拥有或被允许保存的内容。未经许可不要再分发其他创作者的作品，也不要用该工具规避 Suno 自身的限制。本工具用于个人备份与授权工作流。",

      sponsor_label: "赞助商",
      footer: "UseSuno 是一个独立、非官方的 Suno 辅助工具。Suno 及相关名称归其所有者所有。与 Suno 无隶属关系。",

      m_audio_title: "选择音频格式",
      m_audio_sub: "选择你希望保存歌曲音频的方式。",
      m_audio_mp3: "MP3",
      m_audio_mp3_sub: "小巧，处处可播放，含歌曲信息",
      m_audio_wav: "WAV",
      m_audio_wav_sub: "无损 PCM，便于剪辑",
      m_audio_original: "原始",
      m_audio_original_sub: "最快路径，无需转码",
      m_playlist_title: "这看起来像一个歌单链接",
      m_playlist_sub: "本下载器一次只处理一首歌曲或 Hook。请将其作为单曲打开，或使用歌单下载器处理整个列表。",
      m_playlist_btn: "保留这首歌曲",
      m_profile_title: "这看起来像一个主页链接",
      m_profile_sub: "本下载器一次只读取一首歌曲。请使用主页下载器分析创作者的歌曲，并保存可用的 MP3 或 ZIP。",
      m_profile_btn: "留在此处",

      proxy_summary: "高级：媒体抓取代理（可选）",
      proxy_p: "真实下载由随附的 Node 服务端（<code>/api/song</code> + <code>/api/media</code>）提供，因此公开部署无需额外配置即可抓取真实的 Suno 文件。如果你将静态文件单独托管，请在此设置一个转发到 Suno 的 CORS 代理（例如 <code>https://your-proxy.example/?url=</code>）以保持下载可用。留空则使用随附服务端，或回退到演示模式。",
      proxy_save: "保存",
      proxy_saved: "代理已保存。将通过它抓取真实的 Suno 文件。",
      proxy_cleared: "代理已清除。当前以演示模式运行。",
      proxy_placeholder: "https://your-proxy.example/?url=",

      meta_desc: "免费 Suno 歌曲下载器。将任何公开的 Suno 歌曲或 Hook 下载为 MP3、WAV、原始音频、MP4 视频或封面图。解密与可选的格式转换都在你的浏览器中完成。",
      meta_title: "Suno 下载器 —— 将 Suno 歌曲下载为 MP3 与 MP4",

      status_loading: "正在加载歌曲…",
      status_zip: "正在打包 ZIP…",
      status_zip_saved: "ZIP 已保存。",
      status_saved: "已保存",
      status_preparing: "正在准备下载…",
      status_demo: "演示模式 —— 运行随附的 Node 服务端（或在下方设置媒体代理）即可抓取真实的 Suno 文件。完整流程均可交互。",
      status_demo_fallback: "无法连接下载服务端——当前为演示模式。若要真实下载，请部署随附的 Node 服务端。",
      err_empty: "请先粘贴 Suno 链接。",
      err_invalid: "这看起来不是一个有效的链接。请使用完整的 Suno URL。",
      err_host: "这看起来不是 Suno 链接。请使用 suno.com/song/…、suno.com/s/… 或 suno.com/hook/…",
      err_missing_id_generic: "该链接缺少歌曲或 Hook 的 ID。",
      err_missing_song_id: "歌曲链接缺少歌曲 ID。",
      err_missing_hook_id: "Hook 链接缺少 ID。",
      err_unsupported: "不支持的 Suno 链接。请使用来自 suno.com 的歌曲、Hook、歌单或主页链接。",
      err_load: "无法加载该链接。请确认它是公开的 Suno 歌曲，且你的代理可访问。",
      err_no_song: "找到了页面但没有可播放的歌曲。该链接可能是私密的、已删除的，或受地区限制。",
      err_download: "下载失败。请重试或检查你的代理。",
      err_timeout: "请求超时，请重试。",
      err_unreachable: "无法连接到 Suno。请确认链接为公开歌曲，或稍后重试。",

      lang_label: "语言"
    }
  };

  var STORAGE_KEY = "usesuno-lang";

  function getLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  function t(key) {
    var lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function applyLang(lang) {
    if (lang !== "en" && lang !== "zh") lang = "en";
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.documentElement.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var attr = el.getAttribute("data-i18n-attr");
      var val = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || "";
      if (attr) el.setAttribute(attr, val);
      else el.innerHTML = val;
    });

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", t("meta_desc"));

    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang-btn") === lang);
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang-btn") === lang));
    });
  }

  function initSwitcher() {
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        applyLang(b.getAttribute("data-lang-btn"));
      });
    });
  }

  window.I18N = I18N;
  window.t = t;
  window.getLang = getLang;
  window.applyLang = applyLang;
  window.initLangSwitcher = initSwitcher;

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(getLang());
    initSwitcher();
  });
})();
