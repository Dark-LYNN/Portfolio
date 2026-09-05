export type AppId =
  | "kitty"
  | "browser"
  | "files"
  | "code"
  | "about";

export interface OsWindow {
  id: number;
  app: AppId;
  title: string;
  workspace: number;
  floating: boolean;
  fullscreen: boolean;
  minimized?: boolean;
  /** file opened in this window (e.g. code editor), if any */
  file?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export const APPS: Record<
  AppId,
  { title: string; icon: string; className: string; exec: string }
> = {
  kitty: { title: "kitty — zsh", icon: "", className: "Kitty", exec: "kitty -e zsh" },
  browser: { title: "Brave — lynnux.xyz", icon: "", className: "Brave", exec: "Brave-browser" },
  files: { title: "Nautilus — Home", icon: "󱛟", className: "Files", exec: "nautilus" },
  code: { title: "VSCodium — portfolio", icon: "", className: "VsCode", exec: "codium" },
  about: { title: "About Lynn", icon: "", className: "About", exec: "lynnux-about" },
};

export const WORKSPACE_ICONS = ["一", "二", "三", "四", "五", "六", "七"] as const;
