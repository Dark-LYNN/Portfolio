/* Shiki highlighter, loaded lazily (dynamic import) so the main bundle
   stays lean. JavaScript regex engine — no WASM. Only the listed
   grammars + Dark Plus theme are bundled. */
import { createHighlighterCoreSync } from "@shikijs/core";
import type { HighlighterCore } from "@shikijs/types";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import darkPlus from "@shikijs/themes/dark-plus";
import typescript from "@shikijs/langs/typescript";
import tsx from "@shikijs/langs/tsx";
import javascript from "@shikijs/langs/javascript";
import jsonc from "@shikijs/langs/jsonc";
import css from "@shikijs/langs/css";
import html from "@shikijs/langs/html";
import markdown from "@shikijs/langs/markdown";
import ini from "@shikijs/langs/ini";
import shellscript from "@shikijs/langs/shellscript";

let hl: HighlighterCore | null = null;

export function getHighlighter(): HighlighterCore {
  if (!hl) {
    hl = createHighlighterCoreSync({
      engine: createJavaScriptRegexEngine(),
      themes: [darkPlus],
      langs: [...typescript, ...tsx, ...javascript, ...jsonc, ...css, ...html, ...markdown, ...ini, ...shellscript],
    });
  }
  return hl;
}
