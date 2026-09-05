import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { HighlighterCore } from "@shikijs/types";
import { HL_THEME, escapeHtml, langForFile } from "../highlight";
import "./AppContents.css";

export function AboutApp() {
  return (
    <div className="app-content about">
      <h2>About me</h2>
      <p>
        Hi there i'm Lynn and i am a passionate Discord bot/website developer with experience
        in various programming languages such as Python, JavaScript, and HTML/CSS. I love
        creating new projects and bringing ideas to life through code. And as an extra i try
        my best creating twitch discord (chibi) emoji's at an amateur level.
      </p>
      <p>
        I'm constantly learning and exploring new technologies to improve my skills and provide
        better solutions. Let's work together to create something amazing!
      </p>
      <h3>What i'm doing</h3>
      <ul>
        <li><b>Twitch/Discord emoji design</b> — amateur chibi emotes.</li>
        <li><b>Web design</b> — average quality, amateur level.</li>
        <li><b>Web development</b> — sites & tooling.</li>
        <li><b>Discord Bots</b> — e.g. Akira.</li>
      </ul>
      <h3>Testimonial</h3>
      <blockquote>
        “Lynnux is a detailed professional who care's deeply for their work. Their Lifeguard
        Mercy Emotes have engaged and created funny moments in my chat.” — Mycelia
      </blockquote>
    </div>
  );
}

const BOOKMARKS: [string, string, string][] = [
  ["Akira", "Discord Bot Development", "https://discord.com/application-directory/738057910923296839"],
  ["Akira Website", "Web development", "https://akira.lynnux.xyz"],
  ["Emote's", "Art designs", "https://lynnux.xyz/emotes"],
  ["lynnux.xyz", "Home", "https://lynnux.xyz"],
];

// Local start-page index. Only whitelisted hosts — this is what the
// emulated search engine searches.
const SEARCH_INDEX: { title: string; url: string; desc: string; keys: string }[] = [
  {
    title: "lynnux.xyz — Lynn",
    url: "https://lynnux.xyz",
    desc: "Home of Lynnux — Discord bot & website developer, chibi emote artist.",
    keys: "lynn home portfolio developer discord bot website emotes",
  },
  {
    title: "Akira Website",
    url: "https://akira.lynnux.xyz",
    desc: "Website for Akira, Lynn's Discord bot.",
    keys: "akira bot discord website",
  },
  {
    title: "Emote's — Twitch/Discord emoji",
    url: "https://lynnux.xyz/emotes",
    desc: "Chibi Twitch and Discord emotes, made at an amateur level with love.",
    keys: "emotes emoji twitch discord chibi art design",
  },
];

interface Tab {
  id: number;
  title: string;
  url: string | null;
  blocked: boolean;
  /** internal browser:// page name (settings, about), if any */
  internal: string | null;
}

// Only these hosts may load inside the iframe viewport (Lynn's own domains).
// Everything else renders a blocked notice with an external-open link
// (prevents clickjacking/phishing via arbitrary embedded pages).
const IFRAME_WHITELIST = ["lynnux.xyz", "akira.lynnux.xyz"];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url;
  }
}

function isWhitelisted(url: string): boolean {
  const host = hostOf(url);
  return IFRAME_WHITELIST.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

let nextTab = 1;

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (/^[a-z]+:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function looksLikeUrl(q: string): boolean {
  const t = q.trim();
  return /^[a-z]+:\/\//i.test(t) || (/^[^\s]+\.[^\s]{2,}(\/\S*)?$/.test(t) && !t.includes(" "));
}

function searchIndex(q: string) {
  const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (toks.length === 0) return [];
  return SEARCH_INDEX.filter((e) => {
    const hay = `${e.title} ${e.url} ${e.desc} ${e.keys}`.toLowerCase();
    return toks.every((t) => hay.includes(t));
  });
}

function StartPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const results = searchIndex(submitted);

  function submit(raw: string) {
    const query = raw.trim();
    if (!query) {
      setSubmitted("");
      return;
    }
    if (looksLikeUrl(query)) {
      onNavigate(query);
      return;
    }
    setSubmitted(query);
  }

  return (
    <div className="browser-newtab start">
      <div className="start-logo">
        <span className="start-logo-icon"></span>
        <span className="start-logo-word">
          lynnux<em>search</em>
        </span>
      </div>
      <form
        className="start-box"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
      >
        <span className="start-mag"></span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (submitted) setSubmitted(e.target.value);
          }}
          placeholder="Search lynnux.xyz…"
          spellCheck={false}
          autoComplete="off"
        />
        {q && (
          <button type="button" className="start-clear" title="clear" onClick={() => { setQ(""); setSubmitted(""); }}>
            ×
          </button>
        )}
      </form>
      {submitted === "" ? (
        <>
          <div className="start-tiles">
            {SEARCH_INDEX.map((e) => (
              <button key={e.url} className="start-tile" onClick={() => onNavigate(e.url)}>
                <span className="start-tile-icon">{e.title.charAt(0).toUpperCase()}</span>
                <span>{e.title.split(" — ")[0]}</span>
              </button>
            ))}
          </div>
          <p className="hint">Fake (Emulated) Browser</p>
        </>
      ) : results.length > 0 ? (
        <div className="start-results">
          <p className="start-count">
            {results.length} result{results.length === 1 ? "" : "s"} on whitelisted sites
          </p>
          {results.map((e) => (
            <button key={e.url} className="start-result" onClick={() => onNavigate(e.url)}>
              <span className="start-result-url">{e.url}</span>
              <span className="start-result-title">{e.title}</span>
              <span className="start-result-desc">{e.desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="start-noresults">
          <p>
            No results for <b>{submitted}</b> on whitelisted sites.
          </p>
          <p className="hint">Try “emotes”, “akira” or “bot”. Anything off-whitelist opens via ↗ instead.</p>
        </div>
      )}
    </div>
  );
}

const ACCENTS = [
  ["Lavender", "#c1c1ff"],
  ["Mint", "#98ff98"],
  ["Autumn", "#ff8700"],
  ["Telegram", "#66a2ff"],
] as const;

function loadAccent(): string {
  try {
    return localStorage.getItem("brave-accent") ?? ACCENTS[0][1];
  } catch {
    return ACCENTS[0][1];
  }
}

function SettingsPage({
  accent,
  setAccent,
  onClear,
  onNavigate,
}: {
  accent: string;
  setAccent: (c: string) => void;
  onClear: () => void;
  onNavigate: (url: string) => void;
}) {
  return (
    <div className="internal settings">
      <h1>Settings</h1>
      <section>
        <h2>Appearance</h2>
        <p>Accent color for the browser chrome.</p>
        <div className="swatches">
          {ACCENTS.map(([name, color]) => (
            <button
              key={color}
              className={`swatch ${accent === color ? "active" : ""}`}
              style={{ background: color }}
              title={name}
              onClick={() => {
                setAccent(color);
                try {
                  localStorage.setItem("brave-accent", color);
                } catch {
                  /* private mode */
                }
              }}
            />
          ))}
        </div>
      </section>
      <section>
        <h2>Privacy</h2>
        <p>Only whitelisted hosts embed: {IFRAME_WHITELIST.join(", ")}. Everything else is blocked inline.</p>
        <button className="internal-btn" onClick={onClear}>
          Clear browsing data (close all tabs)
        </button>
      </section>
      <section>
        <h2>About</h2>
        <button className="internal-link" onClick={() => onNavigate("browser://about")}>
          browser://about →
        </button>
      </section>
    </div>
  );
}

function AboutPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  return (
    <div className="internal about-page">
      <div className="about-logo"></div>
      <h1>Browser</h1>
      <p className="about-version">Version 1.0 · Hyprland web build</p>
      <dl>
        <div>
          <dt>Engine</dt>
          <dd>Chromium iframe viewport, sandboxed</dd>
        </div>
        <div>
          <dt>Start page</dt>
          <dd>lynnuxsearch (offline index)</dd>
        </div>
        <div>
          <dt>Policy</dt>
          <dd>iframe whitelist: {IFRAME_WHITELIST.join(", ")}</dd>
        </div>
      </dl>
      <button className="internal-link" onClick={() => onNavigate("browser://settings")}>
        browser://settings →
      </button>
    </div>
  );
}

export function BrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: nextTab++, title: "New Tab", url: null, blocked: false, internal: null },
  ]);
  const [activeId, setActiveId] = useState(1);
  const [addr, setAddr] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accent, setAccent] = useState(loadAccent);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  function navigate(urlRaw: string) {
    const url = normalizeUrl(urlRaw);
    if (/^browser:\/\//i.test(url)) {
      const page = hostOf(url);
      const title =
        page === "settings" ? "Settings" : page === "about" ? "About Brave" : page === "newtab" ? "New Tab" : `Unknown: ${page}`;
      setTabs((ts) =>
        ts.map((t) => (t.id === active.id ? { ...t, url, title, blocked: false, internal: page } : t)),
      );
      setAddr(url);
      setLoading(false);
      return;
    }
    const bm = BOOKMARKS.find(([, , u]) => u === url);
    const blocked = !isWhitelisted(url);
    setTabs((ts) =>
      ts.map((t) =>
        t.id === active.id ? { ...t, url, title: bm ? bm[0] : hostOf(url), blocked, internal: null } : t,
      ),
    );
    setAddr(url);
    setLoading(!blocked);
  }

  function newTab() {
    const id = nextTab++;
    setTabs((ts) => [...ts, { id, title: "New Tab", url: null, blocked: false, internal: null }]);
    setActiveId(id);
    setAddr("");
  }

  function clearAll() {
    const id = nextTab++;
    setTabs([{ id, title: "New Tab", url: null, blocked: false, internal: null }]);
    setActiveId(id);
    setAddr("");
  }

  function closeTab(id: number) {
    setTabs((ts) => {
      if (ts.length === 1)
        return [{ id: ts[0].id, title: "New Tab", url: null, blocked: false, internal: null }];
      const idx = ts.findIndex((t) => t.id === id);
      const rest = ts.filter((t) => t.id !== id);
      if (id === activeId) {
        const next = rest[Math.max(0, idx - 1)];
        setActiveId(next.id);
        setAddr(next.url ?? "");
      }
      return rest;
    });
  }

  function switchTab(t: Tab) {
    setActiveId(t.id);
    setAddr(t.url ?? "");
    setLoading(false);
  }

  return (
    <div className="app-content browser-frame-root" style={{ "--b-accent": accent } as CSSProperties}>
      <div className="browser-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`browser-tab ${t.id === active.id ? "active" : ""}`}
            onClick={() => switchTab(t)}
            title={t.url ?? "New Tab"}
          >
            <span className="browser-tab-title">{t.title}</span>
            <span
              className="browser-tab-close"
              title="close tab"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(t.id);
              }}
            >
              ×
            </span>
          </button>
        ))}
        <button className="browser-tab-new" onClick={newTab} title="new tab">
          +
        </button>
      </div>
      <form
        className="browser-bar browser-nav"
        onSubmit={(e) => {
          e.preventDefault();
          if (addr.trim()) navigate(addr);
        }}
      >
        <button type="button" title="reload" onClick={() => { setReloadKey((k) => k + 1); setLoading(true); }}>
          ⟳
        </button>
        <input
          className="browser-url-input"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Search or enter address — try akira.lynnux.xyz"
          spellCheck={false}
          autoComplete="off"
        />
        {active.url && isHttpUrl(active.url) && (
          <a className="browser-external" href={active.url} target="_blank" rel="noreferrer" title="open in real browser">
            ↗
          </a>
        )}
      </form>
      {active.internal ? (
        active.internal === "settings" ? (
          <SettingsPage accent={accent} setAccent={setAccent} onClear={clearAll} onNavigate={navigate} />
        ) : active.internal === "about" ? (
          <AboutPage onNavigate={navigate} />
        ) : active.internal === "newtab" ? (
          <StartPage onNavigate={navigate} />
        ) : (
          <div className="browser-blocked">
            <div className="browser-blocked-icon">󰒃</div>
            <h2>Unknown internal page</h2>
            <p>
              <code>browser://{active.internal}</code> doesn't exist here.
            </p>
            <div className="browser-blocked-actions">
              <button onClick={() => navigate("browser://settings")}>browser://settings</button>
              <button onClick={() => navigate("browser://about")}>browser://about</button>
            </div>
          </div>
        )
      ) : active.url === null ? (
        <StartPage onNavigate={navigate} />
      ) : active.blocked ? (
        <div className="browser-blocked">
          <div className="browser-blocked-icon">󰒃</div>
          <h2>Blocked by iframe whitelist</h2>
          <p>
            <code>{hostOf(active.url)}</code> isn't whitelisted for embedding.
          </p>
          <div className="browser-blocked-actions">
            {isHttpUrl(active.url) && (
              <a href={active.url} target="_blank" rel="noreferrer">
                Open in real browser ↗
              </a>
            )}
            <button onClick={() => navigate("https://lynnux.xyz")}>Back to lynnux.xyz</button>
          </div>
          <p className="hint">Whitelisted: {IFRAME_WHITELIST.join(", ")}</p>
        </div>
      ) : (
        <div className="browser-viewport">
          {loading && <div className="browser-loading">loading {hostOf(active.url)}…</div>}
          <iframe
            key={`${active.id}:${active.url}:${reloadKey}`}
            src={active.url}
            title={active.title}
            className="browser-frame"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onLoad={() => setLoading(false)}
          />
        </div>
      )}
    </div>
  );
}

import { crumbs, listDir, parentOf, readFile } from "../fs";

const PLACES = [
  { label: "Home", icon: "", path: "~" },
  { label: "Desktop", icon: "", path: "~/Desktop" },
  { label: "Documents", icon: "", path: "~/Documents" },
  { label: "Downloads", icon: "", path: "~/Downloads" },
  { label: "Music", icon: "", path: "~/Music" },
  { label: "Pictures", icon: "", path: "~/Pictures" },
  { label: "Videos", icon: "", path: "~/Videos" },
  { label: "portfolio", icon: "", path: "~/portfolio" },
];

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "webp", "jpg", "jpeg", "svg"].includes(ext)) return "";
  if (["ts", "tsx", "js", "json", "css", "html"].includes(ext)) return "";
  return "";
}

function isImageFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ["png", "webp", "jpg", "jpeg", "gif", "svg", "ico", "bmp", "avif", "iso"].includes(ext);
}

export function FilesApp({ onOpenFile }: { onOpenFile: (path: string) => void }) {
  const [path, setPath] = useState("~");
  const [hist, setHist] = useState<string[]>(["~"]);
  const [hi, setHi] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("");

  function go(p: string) {
    const h = [...hist.slice(0, hi + 1), p];
    setHist(h);
    setHi(h.length - 1);
    setPath(p);
    setSelected(null);
    setFilter("");
  }
  function back() {
    if (hi > 0) {
      setPath(hist[hi - 1]);
      setHi(hi - 1);
      setSelected(null);
    }
  }
  function fwd() {
    if (hi < hist.length - 1) {
      setPath(hist[hi + 1]);
      setHi(hi + 1);
      setSelected(null);
    }
  }
  function up() {
    if (path !== "~") go(parentOf(path));
  }

  const all = listDir(path) ?? [];
  const entries = all
    .filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));

  function fullOf(name: string) {
    return path === "~" ? `~/${name}` : `${path}/${name}`;
  }
  function openEntry(name: string, type: "file" | "dir") {
    if (type === "dir") go(fullOf(name));
    else onOpenFile(fullOf(name));
  }

  const parts = crumbs(path);

  return (
    <div className="app-content files-app">
      <div className="nautilus">
        <aside className="nautilus-side">
          {PLACES.map((p) => (
            <button
              key={p.path}
              className={path === p.path || path.startsWith(`${p.path}/`) ? "active" : ""}
              onClick={() => go(p.path)}
            >
              <span className="side-icon">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </aside>
        <div className="nautilus-main">
          <div className="nautilus-bar">
            <button title="back" disabled={hi === 0} onClick={back}></button>
            <button title="forward" disabled={hi >= hist.length - 1} onClick={fwd}></button>
            <button title="up" disabled={path === "~"} onClick={up}></button>
            <nav className="crumbs">
              {parts.map((c, i) => {
                const target = i === 0 ? "~" : `~/${parts.slice(1, i + 1).join("/")}`;
                return (
                  <span key={target}>
                    {i > 0 && <span className="crumb-sep">/</span>}
                    <button className={i === parts.length - 1 ? "current" : ""} onClick={() => go(target)}>
                      {c === "~" ? "Home" : c}
                    </button>
                  </span>
                );
              })}
            </nav>
            <span className="nautilus-search"></span>
            <input
              className="nautilus-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search"
              spellCheck={false}
            />
            <div className="view-toggle">
              <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} title="grid view">
                Grid
              </button>
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} title="list view">
                List
              </button>
            </div>
          </div>
          <div className={`nautilus-body ${view}`}>
            {entries.length === 0 && <p className="nautilus-empty">{filter ? "No matching files" : "Folder is empty"}</p>}
            {entries.map((e) => (
              <button
                key={e.name}
                className={`n-entry ${selected === e.name ? "selected" : ""}`}
                onClick={() => setSelected(e.name)}
                onDoubleClick={() => openEntry(e.name, e.type)}
                title={e.type === "dir" ? "double-click to open" : "double-click to open in Code"}
              >
                <span className={`n-icon ${e.type}`}>{e.type === "dir" ? "" : fileIcon(e.name)}</span>
                <span className="n-name">{e.name}</span>
              </button>
            ))}
          </div>
          <div className="nautilus-status">
            <span>{all.length} item{all.length === 1 ? "" : "s"}</span>
            {selected && <span className="status-sel">{selected} selected</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function baseName(p: string): string {
  return p.split("/").pop() ?? p;
}

function DirTree({
  dir,
  depth,
  active,
  expanded,
  onToggle,
  onOpen,
}: {
  dir: string;
  depth: number;
  active: string | null;
  expanded: Record<string, boolean>;
  onToggle: (dir: string) => void;
  onOpen: (file: string) => void;
}) {
  const entries = (listDir(dir) ?? []).sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1,
  );
  return (
    <>
      {entries.map((e) => {
        const full = dir === "~" ? `~/${e.name}` : `${dir}/${e.name}`;
        if (e.type === "dir") {
          const open = !!expanded[full];
          return (
            <div key={full}>
              <button className="tree-row" style={{ paddingLeft: 8 + depth * 12 }} onClick={() => onToggle(full)}>
                <span className={`tree-arrow ${open ? "open" : ""}`} />
                <span className="tree-icon"></span>
                <span className="tree-name">{e.name}</span>
              </button>
              {open && (
                <DirTree dir={full} depth={depth + 1} active={active} expanded={expanded} onToggle={onToggle} onOpen={onOpen} />
              )}
            </div>
          );
        }
        return (
          <button
            key={full}
            className={`tree-row file ${active === full ? "active" : ""}`}
            style={{ paddingLeft: 8 + depth * 12 }}
            onClick={() => onOpen(full)}
          >
            <span className="tree-arrow" />
            <span className="tree-icon file">{fileIcon(e.name)}</span>
            <span className="tree-name">{e.name}</span>
          </button>
        );
      })}
    </>
  );
}

export function CodeApp({ file }: { file?: string | null }) {
  const [tabs, setTabs] = useState<string[]>(file ? [file] : []);
  const [activeTab, setActiveTab] = useState<string | null>(file ?? null);
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // expand ancestors of the opened file so it's visible in the tree
    const ex: Record<string, boolean> = {};
    if (file) {
      let d = parentOf(file);
      while (true) {
        ex[d] = true;
        if (d === "~") break;
        d = parentOf(d);
      }
    }
    return ex;
  });
  const [error, setError] = useState<string | null>(null);
  const errTimer = useRef<number | null>(null);
  const [hl, setHl] = useState<HighlighterCore | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    let live = true;
    import("../shiki-setup")
      .then((m) => {
        if (live) setHl(m.getHighlighter());
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (errTimer.current !== null) window.clearTimeout(errTimer.current);
    },
    [],
  );

  const root = file ? (() => {
    // explorer roots at the top-level dir containing the file (~/x/...)
    const rel = file === "~" ? [] : file.slice(2).split("/");
    return rel.length > 1 ? `~/${rel[0]}` : "~";
  })() : "~/portfolio/new";

  function openTab(path: string) {
    setTabs((ts) => (ts.includes(path) ? ts : [...ts, path]));
    setActiveTab(path);
  }

  function closeTab(path: string) {
    setTabs((ts) => {
      const rest = ts.filter((t) => t !== path);
      if (activeTab === path) setActiveTab(rest[rest.length - 1] ?? null);
      return rest;
    });
  }

  function contentOf(path: string): string {
    return buffers[path] ?? readFile(path) ?? "";
  }

  function isDirty(path: string): boolean {
    return buffers[path] !== undefined && buffers[path] !== (readFile(path) ?? "");
  }

  const dirtyCount = tabs.filter(isDirty).length;
  const content = activeTab && !isImageFile(activeTab) ? contentOf(activeTab) : "";
  const lang = activeTab ? (isImageFile(activeTab) ? "image" : langForFile(activeTab)) : null;
  const highlighted = useMemo(() => {
    if (!activeTab || !lang || lang === "image") return escapeHtml(content);
    if (!hl) return escapeHtml(content);
    try {
      return hl.codeToHtml(content, { lang, theme: HL_THEME });
    } catch {
      return escapeHtml(content);
    }
  }, [hl, activeTab, content, lang]);

  function save() {
    if (!activeTab) return;
    if (errTimer.current !== null) window.clearTimeout(errTimer.current);
    setError(`Failed to save '${baseName(activeTab)}': Permission denied - the web filesystem is read-only.`);
    errTimer.current = window.setTimeout(() => setError(null), 6000);
  }

  return (
    <div className="app-content code">
      <div className="code-side">
        <div className="code-side-title">EXPLORER</div>
        <div className="code-root">{root === "~" ? "Home" : baseName(root)}</div>
        <DirTree
          dir={root}
          depth={0}
          active={activeTab}
          expanded={expanded}
          onToggle={(d) => setExpanded((e) => ({ ...e, [d]: !e[d] }))}
          onOpen={openTab}
        />
      </div>
      <div className="code-editor">
        <div className="code-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              className={`code-tab ${t === activeTab ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
              title={t}
            >
              <span className={isDirty(t) ? "dirty" : ""}>{isDirty(t) ? "● " : ""}{baseName(t)}</span>
              <span
                className="code-tab-close"
                title="close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(t);
                }}
              >
                ×
              </span>
            </button>
          ))}
          <span className="code-save-wrap">
            <button onClick={save} title="Save (Ctrl+S)" disabled={!activeTab || isImageFile(activeTab)}>
              Save
            </button>
          </span>
        </div>
        {activeTab && isImageFile(activeTab) ? (
          <div className="code-binary">
            <span className="code-binary-icon"></span>
            <p>This file is not supported in the editor.</p>
            <p className="hint">{baseName(activeTab)} — {contentOf(activeTab).replace(/[<>]/g, "")}</p>
          </div>
        ) : activeTab ? (
          <div className="code-editor-area">
            <pre
              ref={preRef}
              className="code-highlight"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
            <textarea
              key={activeTab}
              className="code-area overlay"
              value={content}
              wrap="off"
              onChange={(e) => {
                const v = e.target.value;
                const cur = activeTab;
                if (cur) setBuffers((b) => ({ ...b, [cur]: v }));
              }}
              onScroll={(e) => {
                const t = e.currentTarget;
                if (preRef.current) {
                  preRef.current.scrollTop = t.scrollTop;
                  preRef.current.scrollLeft = t.scrollLeft;
                }
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                  e.preventDefault();
                  save();
                  return;
                }
                if (e.key === "Tab") {
                  e.preventDefault();
                  const ta = e.currentTarget;
                  const s = ta.selectionStart;
                  const v = `${ta.value.slice(0, s)}  ${ta.value.slice(ta.selectionEnd)}`;
                  const cur = activeTab;
                  if (cur) setBuffers((b) => ({ ...b, [cur]: v }));
                  requestAnimationFrame(() => {
                    ta.selectionStart = ta.selectionEnd = s + 2;
                  });
                }
              }}
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="code-welcome">
            <p>VSCodium (emulated)</p>
            <p className="hint">Open a file from the Explorer — or double-click any file in Files.</p>
          </div>
        )}
        <div className="code-status">
          <span>{activeTab ? baseName(activeTab) : "no file"}</span>
          <span>{activeTab && !isImageFile(activeTab) ? `${contentOf(activeTab).split("\n").length} lines` : ""}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>{lang ?? "text"}</span>
          <span>{dirtyCount > 0 ? `${dirtyCount} unsaved` : "clean"}</span>
        </div>
        {error && (
          <div className="code-toast">
            <span>{error}</span>
            <button onClick={() => setError(null)} title="dismiss">×</button>
          </div>
        )}
      </div>
    </div>
  );
}