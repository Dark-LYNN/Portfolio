/* Language detection for the emulated editor. No shiki imports here —
   the heavy highlighter lives in shiki-setup.ts and loads lazily. */

export const HL_THEME = "dark-plus";

/** Shiki language id for a file, or null when no grammar fits (plain text). */
export function langForFile(path: string): string | null {
  const base = path.split("/").pop() ?? "";
  if (base === ".zshrc" || base.endsWith(".zsh-theme")) return "shellscript";
  if (base === "config") return "jsonc";
  const ext = base.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "ts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
    case "jsonc":
      return "jsonc";
    case "css":
      return "css";
    case "html":
      return "html";
    case "md":
      return "markdown";
    case "conf":
      return "ini";
    default:
      return null;
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
