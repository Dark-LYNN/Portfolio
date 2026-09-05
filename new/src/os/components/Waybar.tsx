import "./Waybar.css";
import { APPS, WORKSPACE_ICONS } from "../types";
import { useEffect, useState } from "react";

interface Props {
  activeWorkspace: number;
  onWorkspace: (ws: number) => void;
  windows: { id: number; app: keyof typeof APPS; workspace: number }[];
  focusedApp: string;
  onLauncher: () => void;
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(d: Date) {
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ap}`;
}

// Fake but lively stats, styled like waybar cpu/memory modules
function useFakeStats() {
  const [cpu, setCpu] = useState(7);
  const [mem, setMem] = useState(3.2);
  useEffect(() => {
    const t = setInterval(() => {
      setCpu((c) => Math.max(2, Math.min(92, Math.round(c + (Math.random() * 14 - 7)))));
      setMem((m) => Math.max(2.4, Math.min(9.8, +(m + (Math.random() * 0.4 - 0.2)).toFixed(1))));
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return { cpu, mem };
}

export default function Waybar({ activeWorkspace, onWorkspace, windows, focusedApp, onLauncher }: Props) {
  const now = useClock();
  const { cpu, mem } = useFakeStats();

  return (
    <div id="waybar">
      <div className="wb-left">
        <div id="workspaces">
          {WORKSPACE_ICONS.map((icon, i) => {
            const ws = i + 1;
            const wsWindows = windows.filter((w) => w.workspace === ws);
            const cls = [
              ws === activeWorkspace ? "active" : "",
              wsWindows.length > 0 && ws !== activeWorkspace ? "has-windows" : "",
            ]
              .join(" ")
              .trim();
            return (
              <button key={ws} className={cls} onClick={() => onWorkspace(ws)} title={`Workspace ${ws} (ALT+${ws})`}>
                <span className="ws-icon">{icon}</span>
                {wsWindows.length > 0 && (
                  <>
                    <span className="ws-sep">  </span>
                    <span className="ws-wins">
                      {wsWindows.map((w) => (
                        <span key={w.id} className="ws-win">
                          {APPS[w.app as keyof typeof APPS]?.icon ?? ""}
                        </span>
                      ))}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <span id="custom-arrow-dec">  </span>
        <div id="app-title-container">
          <span id="custom-app-title-icon">{focusedApp ? APPS[focusedApp as keyof typeof APPS]?.icon ?? "" : ""}</span>
          <span id="custom-app-name">
            <b>{focusedApp ? APPS[focusedApp as keyof typeof APPS]?.title ?? focusedApp : "Hyprland"}</b>
          </span>
        </div>
      </div>

      <div className="wb-center">
        <div id="tray" title="tray (snixembed)">
          <span>󰂱</span>
          <span>󰖪</span>
          <span></span>
        </div>
      </div>

      <div className="wb-right">
        <span id="cpu"> <b>{cpu}%</b></span>
        <span className="wb-dot">  </span>
        <span id="memory"> <b>{mem}G</b></span>
        <span className="wb-dot">  </span>
        <span id="network">  <span className="fix-12"> </span><b>HomeNet</b> </span>
        <span id="custom-left-arrw"></span>
        <div id="system-container" title="system-container">
          <span> <b>62</b></span>
          <span>󰂱</span>
        </div>
        <span className="wb-dot-alt">  </span>
        <div id="privacy-container" title="privacy-container">
          <span id="clock"> <b>{fmtTime(now)}</b></span>
        </div>
        <span className="wb-dot-alt">  </span>
        <div id="launcher">
          <button id="custom-launcher" onClick={onLauncher} title="wofi --show drun (ALT+Z)">
            󰌧
          </button>
        </div>
      </div>
    </div>
  );
}
