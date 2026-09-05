import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Waybar from "./components/Waybar";
import OsWindowView from "./components/Window";
import Launcher from "./components/Launcher";
import Terminal from "./apps/Terminal";
import { AboutApp, BrowserApp, CodeApp, FilesApp } from "./apps/AppContents";
import { APPS, type AppId, type OsWindow } from "./types";
import "./fonts.css";
import "./Desktop.css";

let nextId = 1;
let nextZ = 10;

function cascade(n: number) {
  const off = (n % 6) * 36;
  return { x: 60 + off, y: 30 + off };
}

export default function Desktop() {
  const [windows, setWindows] = useState<OsWindow[]>(() => [
    { id: nextId++, app: "kitty", title: APPS.kitty.title, workspace: 1, floating: true, fullscreen: false, x: 80, y: 40, w: 640, h: 400, z: nextZ++ },
    { id: nextId++, app: "about", title: APPS.about.title, workspace: 1, floating: true, fullscreen: false, x: 760, y: 60, w: 520, h: 440, z: nextZ++ },
  ]);
  const [activeWs, setActiveWs] = useState(1);
  const [focusedId, setFocusedId] = useState<number | null>(2);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => windows.filter((w) => w.workspace === activeWs), [windows, activeWs]);
  const focused = windows.find((w) => w.id === focusedId && w.workspace === activeWs)
    ?? [...visible].sort((a, b) => b.z - a.z)[0];

  const openApp = useCallback((appRaw: string, file?: string) => {
    const app = appRaw as AppId;
    if (!APPS[app]) return;
    const { x, y } = cascade(nextId);
    const id = nextId++;
    // default sizes per app, like hypr dwindle-ish tiling offset
    const size = app === "browser" ? { w: 900, h: 560 }
      : app === "code" ? { w: 860, h: 520 }
      : app === "files" ? { w: 620, h: 420 }
      : { w: 640, h: 420 };
    const title = file ? `${file.split("/").pop()} — VSCodium` : APPS[app].title;
    setWindows((ws) => [...ws, {
      id, app, title, file, workspace: activeWs,
      floating: true, fullscreen: false, x, y, ...size, z: nextZ++,
    }]);
    setFocusedId(id);
    setLauncherOpen(false);
  }, [activeWs]);

  const closeWin = useCallback((id: number) => {
    setWindows((ws) => ws.filter((w) => w.id !== id));
    setFocusedId((f) => (f === id ? null : f));
  }, []);

  const focusWin = useCallback((id: number) => {
    setFocusedId(id);
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z: nextZ++ } : w)));
  }, []);

  const toggleFullscreen = useCallback((id: number) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, fullscreen: !w.fullscreen } : w)));
  }, []);

  const moveWin = useCallback((id: number, x: number, y: number) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWin = useCallback((id: number, x: number, y: number, w: number, h: number) => {
    setWindows((ws) => ws.map((win) => (win.id === id ? { ...win, x, y, w, h } : win)));
  }, []);

  // Web keybinds: Hyprland's SUPER doesn't exist in the browser, and browsers
  // swallow CTRL combos (CTRL+1..8 switch tabs, CTRL+W closes the tab), so
  // ALT is the advertised modifier. CTRL and META are accepted too.
  // ALT+1..7 workspaces, Q browser, A code, O files,
  // ENTER terminal, Z launcher, C kill, F fullscreen, ESC closes launcher
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setLauncherOpen(false); return; }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey || e.altKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (["1","2","3","4","5","6","7"].includes(k)) { e.preventDefault(); setActiveWs(Number(k)); }
      else if (k === "q") { e.preventDefault(); openApp("browser"); }
      else if (k === "a") { e.preventDefault(); openApp("code"); }
      else if (k === "o") { e.preventDefault(); openApp("files"); }
      else if (k === "enter") { e.preventDefault(); openApp("kitty"); }
      else if (k === "z") { e.preventDefault(); setLauncherOpen((v) => !v); }
      else if (k === "c") { e.preventDefault(); if (focusedId) closeWin(focusedId); }
      else if (k === "f") { e.preventDefault(); if (focusedId) toggleFullscreen(focusedId); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openApp, focusedId, closeWin, toggleFullscreen]);

  function renderApp(win: OsWindow) {
    switch (win.app) {
      case "kitty": return <Terminal onOpenApp={openApp} />;
      case "browser": return <BrowserApp />;
      case "files": return <FilesApp onOpenFile={(p) => openApp("code", p)} />;
      case "code": return <CodeApp file={win.file} />;
      case "about": return <AboutApp />;
    }
  }

  return (
    <div className="hypr-desktop">
      <Waybar
        activeWorkspace={activeWs}
        onWorkspace={setActiveWs}
        windows={windows}
        focusedApp={focused?.app ?? ""}
        onLauncher={() => setLauncherOpen(true)}
      />
      <div className="hypr-area" ref={areaRef}>
        {visible.length === 0 && (
          <div className="hypr-empty">
            <p>Workspace {activeWs} — empty</p>
            <p className="hypr-empty-keys">ALT+ENTER terminal • ALT+Z launcher • ALT+Q browser</p>
            <Link to="/" className="hypr-exit">← back to portfolio landing</Link>
          </div>
        )}
        {visible.map((w) => (
          <OsWindowView
            key={w.id}
            win={w}
            focused={focused?.id === w.id}
            areaRef={areaRef}
            onFocus={focusWin}
            onClose={closeWin}
            onToggleFullscreen={toggleFullscreen}
            onMove={moveWin}
            onResize={resizeWin}
          >
            {renderApp(w)}
          </OsWindowView>
        ))}
        <Launcher open={launcherOpen} onPick={openApp} onClose={() => setLauncherOpen(false)} />
        <div className="hypr-hint">
          <Link to="/">landing</Link>
          <span> • ALT+1..7 workspaces • ALT+Z wofi • ALT+C kill • ALT+F fullscreen • drag borders to resize</span>
        </div>
      </div>
    </div>
  );
}
