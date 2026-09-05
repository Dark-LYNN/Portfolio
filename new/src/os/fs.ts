/* Shared fake filesystem for the emulated desktop.
   Both kitty (ls/cd/pwd/cat) and nautilus read from this tree,
   so they always agree with each other. Paths look like "~/portfolio/new". */

export interface FsFile {
  type: "file";
  content: string;
}

export interface FsDir {
  type: "dir";
  children: Record<string, FsNode>;
}

export type FsNode = FsFile | FsDir;

const f = (content: string): FsFile => ({ type: "file", content });
const d = (children: Record<string, FsNode> = {}): FsDir => ({ type: "dir", children });

// Real dotfile contents, inlined at build/dev time by the rice-files vite
// plugin (virtual:rice-files). Null when unreadable (other machines) —
// every node below falls back to its placeholder string.
import RICE_REAL from "virtual:rice-files";

function real(webPath: string, fallback: string): string {
  return RICE_REAL[webPath] ?? fallback;
}

export const FS_ROOT: FsDir = d({
  Desktop: d(),
  Documents: d({
    "notes.txt": f("ideas for the new portfolio:\n- hyprland in the browser (wip!)\n- more chibi emotes"),
    "todo.md": f("# todo\n- [x] rice hyprland\n- [ ] finish portfolio\n- [ ] touch grass"),
  }),
  Downloads: d({
    "nixos.iso": f("<binary: 2.4G NixOS installer image>"),
  }),
  Music: d(),
  Pictures: d({
    wallpapers: d({
      "001.png": f("<binary: 4000x1919 wallpaper>"),
    }),
    emotes: d({
      "mercy-lifeguard.png": f("<binary: chibi emote, wip>"),
    }),
  }),
  Videos: d(),
  portfolio: d({
    "AGENTS.md": f(real("~/portfolio/AGENTS.md", '# AI Agent Instructions for "Lynnux\'s Portfolio"\n\nOLD portfolio: next.js template in /old.\nNEW portfolio: custom vite + react site in /new.')),
    new: d({
      "package.json": f('{\n  "name": "new",\n  "private": true,\n  "packageManager": "pnpm@10.33.0"\n}'),
      "vite.config.ts": f("import react from '@vitejs/plugin-react'\nimport { defineConfig } from 'vite'\n\nexport default defineConfig({\n  plugins: [react()],\n})"),
      "index.html": f('<!doctype html>\n<html lang="en">\n  <head>\n    <title>Lynnux Portfolio</title>\n  </head>'),
      src: d({
        "main.tsx": f("import App from './App.tsx'\n// entrypoint"),
        "App.tsx": f("// routes: / -> landing, /interactive -> desktop"),
        os: d({
          "Desktop.tsx": f("// window manager + workspaces"),
          "theme.css": f("/* Madness theme vars */"),
        }),
      }),
      public: d({
        wallpapers: d(),
        fonts: d(),
      }),
    }),
    old: d({
      "package.json": f('{\n  "name": "portfolio",\n  "private": true,\n  "dependencies": { "next": "14.2.3" }\n}'),
      app: d(),
      components: d(),
    }),
  }),
  ".config": d({
    hypr: d({
      "hyprland.conf": f(real("~/.config/hypr/hyprland.conf", "$monitor1 = HDMI-A-1\n$monitor2 = eDP-1")),
      "general.conf": f(real("~/.config/hypr/general.conf", "general {\n  gaps_in = 2\n  border_size = 2\n}")),
      "colors.conf": f(real("~/.config/hypr/colors.conf", "$primary = 0xFFC1C1FF\n$disabled = 0xFF454558")),
      "animation.conf": f(real("~/.config/hypr/animation.conf", "animations {\n  enabled = yes\n}")),
      "keybinds.conf": f(real("~/.config/hypr/keybinds.conf", "$mainMod = SUPER\nbind = $mainMod, Q, exec, Brave-browser")),
      "windowrules.conf": f(real("~/.config/hypr/windowrules.conf", "# window rules")),
      "startup.conf": f(real("~/.config/hypr/startup.conf", "exec-once = waybar")),
    }),
    waybar: d({
      configs: d({
        config: f(real("~/.config/waybar/configs/config", '{ "layer": "top", "height": 46 }')),
      }),
      styling: d({
        "style.css": f(real("~/.config/waybar/styling/style.css", '@import "colors-waybar.css";\n/* Madness theme */')),
        "bar.css": f(real("~/.config/waybar/styling/bar.css", "window#waybar {\n  background-color: @background;\n}")),
        "general.css": f(real("~/.config/waybar/styling/general.css", "/* general module styles */")),
        "workspace.css": f(real("~/.config/waybar/styling/workspace.css", "/* workspace styles */")),
        "colors-waybar.css": f(real("~/.config/waybar/styling/colors-waybar.css", '@import "themes/Madness.css";')),
        themes: d({
          "Madness.css": f(real("~/.config/waybar/styling/themes/Madness.css", "@define-color background #111111;")),
        }),
      }),
    }),
    kitty: d({
      "kitty.conf": f(real("~/.config/kitty/kitty.conf", "font_family JetBrainsMono Nerd Font\nfont_size 10.0\nbackground #111111\nbackground_opacity 0.8")),
    }),
  }),
  ".oh-my-zsh": d({
    themes: d({
      "pixegami-agnoster.zsh-theme": f(
        real("~/.oh-my-zsh/themes/pixegami-agnoster.zsh-theme", "# pixegami-agnoster (placeholder)"),
      ),
    }),
  }),
  ".zshrc": f(real("~/.zshrc", 'export ZSH=~/.oh-my-zsh\nZSH_THEME="pixegami-agnoster"\nplugins=(git zsh-syntax-highlighting zsh-autosuggestions)')),
});

export const HOME_DIR = "~";
export const HOME_PREFIX = "/home/lynnux";

/** The fake repo root — prompt shows a git segment under it, like the real theme. */
export const GIT_ROOT = "~/portfolio";

export function gitBranchFor(cwd: string): string | null {
  return cwd === GIT_ROOT || cwd.startsWith(`${GIT_ROOT}/`) ? "main" : null;
}

/** Split "~/a/b" into ["a","b"]. Returns null for non-home paths. */
function splitHome(path: string): string[] | null {
  if (path === "~") return [];
  if (!path.startsWith("~/")) return null;
  return path.slice(2).split("/").filter((p) => p.length > 0);
}

export function getNode(path: string): FsNode | null {
  const parts = splitHome(path);
  if (parts === null) return null;
  let node: FsNode = FS_ROOT;
  for (const part of parts) {
    if (node.type !== "dir") return null;
    const next: FsNode | undefined = node.children[part];
    if (!next) return null;
    node = next;
  }
  return node;
}

export function isDir(path: string): boolean {
  return getNode(path)?.type === "dir";
}

export function readFile(path: string): string | null {
  const node = getNode(path);
  return node?.type === "file" ? node.content : null;
}

export function listDir(path: string): { name: string; type: "file" | "dir" }[] | null {
  const node = getNode(path);
  if (node?.type !== "dir") return null;
  return Object.entries(node.children)
    .map(([name, child]) => ({ name, type: child.type }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve a cd/ls/cat target against a cwd, like zsh does.
 * Handles ~, ~/x, absolute /home/lynnux/x, relative names,
 * ./x, ../x, a/b/../c. Clamps at ~ (can't leave home).
 * Returns the normalized "~/..." path, or null if it doesn't exist.
 */
export function resolvePath(cwd: string, target: string): string | null {
  const t = target.trim();
  if (t === "" || t === "~") return HOME_DIR;

  let parts: string[];
  if (t === "/") return null;
  if (t.startsWith("/home/lynnux")) {
    const rest = t.slice("/home/lynnux".length);
    parts = rest.split("/").filter((p) => p.length > 0);
  } else if (t.startsWith("~/")) {
    parts = t.slice(2).split("/").filter((p) => p.length > 0);
  } else if (t.startsWith("/")) {
    return null; // outside home: doesn't exist here
  } else {
    parts = [...(splitHome(cwd) ?? []), ...t.split("/").filter((p) => p.length > 0)];
  }

  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      stack.pop(); // clamp: popping empty stack stays at ~
      continue;
    }
    stack.push(part);
  }

  const normalized = stack.length === 0 ? HOME_DIR : `~/${stack.join("/")}`;
  return getNode(normalized) === null ? null : normalized;
}

/** Parent of "~/a/b" is "~/a"; parent of "~" is "~". */
export function parentOf(path: string): string {
  if (path === HOME_DIR) return HOME_DIR;
  const idx = path.lastIndexOf("/");
  return idx <= 1 ? HOME_DIR : path.slice(0, idx);
}

/** Display path for prompt/breadcrumb: "~/portfolio/new" -> ["~","portfolio","new"] */
export function crumbs(path: string): string[] {
  if (path === HOME_DIR) return [HOME_DIR];
  return [HOME_DIR, ...path.slice(2).split("/")];
}

/** System path for pwd: "~" -> "/home/lynnux" */
export function systemPath(path: string): string {
  return path === HOME_DIR ? HOME_PREFIX : `${HOME_PREFIX}${path.slice(1)}`;
}
