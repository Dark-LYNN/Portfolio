import { APPS, type AppId } from "../types";
import "./Launcher.css";

export default function Launcher({ open, onPick, onClose }: { open: boolean; onPick: (app: AppId) => void; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="wofi-overlay" onClick={onClose}>
      <div className="wofi" onClick={(e) => e.stopPropagation()}>
        <div className="wofi-title">wofi --show drun</div>
        <input className="wofi-search" placeholder="type to search…" autoFocus />
        <div className="wofi-list">
          {(Object.keys(APPS) as AppId[]).map((app) => (
            <button key={app} onClick={() => onPick(app)}>
              <span className="wofi-icon">{APPS[app].icon}</span>
              <span className="wofi-name">{app}</span>
              <span className="wofi-exec">{APPS[app].exec}</span>
            </button>
          ))}
        </div>
        <div className="wofi-hint">ALT+Z toggles • ESC closes</div>
      </div>
    </div>
  );
}
