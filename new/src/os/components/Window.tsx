import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import type { OsWindow } from "../types";
import "./Window.css";

interface Props {
  win: OsWindow;
  focused: boolean;
  areaRef: React.RefObject<HTMLDivElement | null>;
  onFocus: (id: number) => void;
  onClose: (id: number) => void;
  onToggleFullscreen: (id: number) => void;
  onMove: (id: number, x: number, y: number) => void;
  onResize: (id: number, x: number, y: number, w: number, h: number) => void;
  children: ReactNode;
}

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const MIN_W = 280;
const MIN_H = 180;

export default function OsWindowView({ win, focused, areaRef, onFocus, onClose, onToggleFullscreen, onMove, onResize, children }: Props) {
  const drag = useRef<{ dx: number; dy: number; dragging: boolean }>({ dx: 0, dy: 0, dragging: false });
  const [, force] = useState(0);

  function onTitlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (win.fullscreen) return;
    if ((e.target as HTMLElement).closest("button")) return;
    onFocus(win.id);
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, dragging: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onTitlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current.dragging || win.fullscreen) return;
    const area = areaRef.current?.getBoundingClientRect();
    if (!area) return;
    const x = Math.max(0, Math.min(e.clientX - area.left - drag.current.dx, area.width - 120));
    const y = Math.max(0, Math.min(e.clientY - area.top - drag.current.dy, area.height - 60));
    onMove(win.id, Math.round(x), Math.round(y));
    force((n) => n + 1);
  }
  function onTitlePointerUp() {
    drag.current.dragging = false;
  }

  const resize = useRef<{
    dir: Dir;
    startX: number;
    startY: number;
    orig: { x: number; y: number; w: number; h: number };
    dragging: boolean;
  } | null>(null);

  function onHandlePointerDown(dir: Dir) {
    return (e: PointerEvent<HTMLDivElement>) => {
      if (win.fullscreen) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus(win.id);
      resize.current = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        orig: { x: win.x, y: win.y, w: win.w, h: win.h },
        dragging: true,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
  }
  function onHandlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const r = resize.current;
    if (!r?.dragging || win.fullscreen) return;
    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;
    let { x, y, w, h } = r.orig;
    if (r.dir.includes("e")) w = r.orig.w + dx;
    if (r.dir.includes("s")) h = r.orig.h + dy;
    if (r.dir.includes("w")) {
      w = r.orig.w - dx;
      x = r.orig.x + dx;
    }
    if (r.dir.includes("n")) {
      h = r.orig.h - dy;
      y = r.orig.y + dy;
    }
    if (w < MIN_W) {
      if (r.dir.includes("w")) x -= MIN_W - w;
      w = MIN_W;
    }
    if (h < MIN_H) {
      if (r.dir.includes("n")) y -= MIN_H - h;
      h = MIN_H;
    }
    onResize(win.id, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function onHandlePointerUp() {
    if (resize.current) resize.current.dragging = false;
  }

  const handles: Dir[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

  const style = win.fullscreen
    ? { left: 0, top: 0, width: "100%", height: "100%", zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      className={`hypr-window ${focused ? "focused" : ""} ${win.fullscreen ? "fullscreen" : ""}`}
      style={style}
      onPointerDown={() => onFocus(win.id)}
    >
      <div
        className="hypr-titlebar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onDoubleClick={() => onToggleFullscreen(win.id)}
      >
        <span className="hypr-title">{win.title}</span>
        <span className="hypr-controls">
          <button title="fullscreen (ALT+F)" onClick={() => onToggleFullscreen(win.id)}>󰊓</button>
          <button title="close (ALT+C)" onClick={() => onClose(win.id)}>󰅖</button>
        </span>
      </div>
      <div className="hypr-body">{children}</div>
      {!win.fullscreen &&
        handles.map((d) => (
          <div
            key={d}
            className={`hypr-resize r-${d}`}
            onPointerDown={onHandlePointerDown(d)}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
          />
        ))}
    </div>
  );
}
