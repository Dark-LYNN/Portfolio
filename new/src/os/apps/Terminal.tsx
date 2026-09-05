import { useEffect, useRef, useState } from "react";
import { gitBranchFor, isDir, listDir, readFile, resolvePath, systemPath } from "../fs";
import "./Terminal.css";

/* Emulates lynnux's real setup:
   - kitty: JetBrainsMono Nerd Font 10, bg #111111 @ 0.8, palette below
   - zsh pixegami-agnoster theme: grey [cwd] line + powerline segments
     (status ✕ / user / git) joined by  (U+E0B0) */

const SEP = "";
const BRANCH = "";

// kitty palette accents used by the theme segments
const GREY8 = "#545454"; // xterm 8 (kitty color8)
const GREEN10 = "#55ff55"; // xterm 10 (kitty color10)
const AUTUMN208 = "#ff8700"; // xterm 208
const RED = "#ff2b2b"; // kitty color1

interface Seg {
  bg: string;
  fg: string;
  text: string;
}

function truncateMiddle(s: string, max = 50) {
  return s.length > max ? `..${s.slice(-(max - 2))}` : s;
}

// Fake filesystem lives in ../fs (shared with nautilus).
// Showing a repo branch segment under ~/portfolio, like the real theme.

function segmentsFor(cwd: string, prevExit: number): Seg[] {
  const segs: Seg[] = [];
  if (prevExit !== 0) segs.push({ bg: "#000000", fg: RED, text: "×" });
  segs.push({ bg: GREY8, fg: GREEN10, text: "lynnux" });
  const branch = gitBranchFor(cwd);
  if (branch) segs.push({ bg: "#000000", fg: AUTUMN208, text: `${BRANCH} ${branch}` });
  return segs;
}

function AgnosterPrompt({ cwd, prevExit, after }: { cwd: string; prevExit: number; after?: React.ReactNode }) {
  const segs = segmentsFor(cwd, prevExit);
  return (
    <div className="pl">
      <div className="pl-head">[{truncateMiddle(cwd)}]</div>
      <div className="pl-row">
        {segs.map((s, i) => (
          <span key={i} className="pl-segwrap">
            {i > 0 && (
              <span className="pl-sep" style={{ color: segs[i - 1].bg, background: s.bg }}>
                {SEP}
              </span>
            )}
            <span className="pl-seg" style={{ background: s.bg, color: s.fg }}>
              {s.text}
            </span>
          </span>
        ))}
        <span className="pl-end" style={{ color: segs[segs.length - 1].bg }}>
          {SEP}
        </span>
        {after}
      </div>
    </div>
  );
}

type Line = { kind: "out"; text: string } | { kind: "cmd"; cmd: string; cwd: string; prevExit: number };

const BOOT: Line[] = [
  { kind: "out", text: "kitty — pixegami-agnoster (emulated)" },
  { kind: "out", text: 'Type "help" for commands. Try: cd portfolio' },
];

export default function Terminal({ onOpenApp }: { onOpenApp: (app: string, file?: string) => void }) {
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [cwd, setCwd] = useState("~");
  const [lastExit, setLastExit] = useState(0);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  function run(cmdRaw: string) {
    const cmd = cmdRaw.trim();
    const promptExit = lastExit;
    const out: Line[] = cmd ? [{ kind: "cmd", cmd, cwd, prevExit: promptExit }] : [];
    let exit = 0;
    let nextCwd = cwd;

    const emit = (text: string | string[]) =>
      out.push(...(Array.isArray(text) ? text : [text]).map((t) => ({ kind: "out" as const, text: t })));

    if (cmd) {
      setHist((h) => [cmd, ...h].slice(0, 50));
      setHistIdx(-1);
      const [bin, ...args] = cmd.split(/\s+/);
      switch (bin) {
        case "help":
          emit(["commands:", "help, about, neofetch, ls, cd, pwd, cat, echo, true, false, open <app>, workspaces, clear", " "]);
          emit(["apps:", "kitty, browser, files, code, about"]);
          break;
        case "about":
          emit(["Hi, i'm Lynn or online mostly known as Lynnux"]);
          emit([" "])
          emit(["I'm mostly just your average boring person, don't really have a lot to say."]);
          emit(["Just passing the time coding projects no-one really cares for and play H-Games."])
          emit(["Like really the main reason for most of my projects exist is to fix a single issue issue only i will probably have."])
          break;
        case "neofetch":
          emit([
            "lynnux@nixos",
            "─────────────────────────",
            "OS: NixOS (web) / Hyprland",
            "Shell: zsh + pixegami-agnoster",
            "Term: kitty / JetBrainsMono Nerd Font",
            "Bar: waybar (Madness)",
          ]);
          break;
        case "ls": {
          const target = args[0] ?? cwd;
          const dir = target === cwd ? cwd : resolvePath(cwd, target);
          const entries = dir === null ? null : listDir(dir);
          if (entries === null) {
            emit([`ls: cannot access '${target}': No such file or directory`]);
            exit = 2;
          } else {
            emit([entries.map((e) => e.name).join("  ") || "(empty)"]);
          }
          break;
        }
        case "pwd":
          emit([systemPath(cwd)]);
          break;
        case "cd": {
          const target = args[0] ?? "~";
          const resolved = resolvePath(cwd, target);
          if (resolved === null) {
            emit([`cd: no such file or directory: ${target}`]);
            exit = 1;
          } else if (!isDir(resolved)) {
            emit([`cd: not a directory: ${target}`]);
            exit = 1;
          } else {
            nextCwd = resolved;
          }
          break;
        }
        case "cat": {
          if (!args[0]) {
            emit(["usage: cat <file>"]);
            exit = 1;
          } else {
            const resolved = resolvePath(cwd, args[0]);
            const node = resolved === null ? null : readFile(resolved);
            if (resolved === null) {
              emit([`cat: ${args[0]}: No such file or directory`]);
              exit = 1;
            } else if (node === null) {
              emit([`cat: ${args[0]}: Is a directory`]);
              exit = 1;
            } else {
              emit(node.split("\n"));
            }
          }
          break;
        }
        case "echo":
          emit([args.join(" ")]);
          break;
        case "whoami":
          emit(["lynnux"]);
          break;
        case "true":
          break;
        case "false":
          exit = 1;
          break;
        case "workspaces":
          emit(["一 二 三 四 五 六 七  (ALT+1..7 to switch)"]);
          break;
        case "open":
          if (!args[0]) emit(["usage: open <kitty|browser|files|code|about> [file]"]);
          else if (args[0] === "code" && args[1]) {
            const resolved = resolvePath(cwd, args[1]);
            if (resolved === null) {
              emit([`open: ${args[1]}: No such file or directory`]);
              exit = 1;
            } else if (isDir(resolved)) {
              emit([`open: ${args[1]}: Is a directory`]);
              exit = 1;
            } else {
              onOpenApp("code", resolved);
              emit([`exec: code ${resolved}`]);
            }
          } else {
            onOpenApp(args[0]);
            emit([`exec: ${args[0]}`]);
          }
          break;
        case "clear":
          setLines([]);
          setCwd(nextCwd);
          setLastExit(0);
          return;
        case "sudo":
          if (args[0]==="rm"&&(args[1]==="-rf"||args[1]==="-fr")) {
            emit(["We're not killing the french are we?"]);
          } else {
            emit(["[sudo] nice try."])
          }
          exit = 1;
          break;
        default:
          emit([`zsh: command not found: ${bin}`]);
          exit = 127;
      }
    }

    setLines((l) => [...l, ...out]);
    setCwd(nextCwd);
    setLastExit(exit);
  }

  return (
    <div className="kitty" onClick={() => inputRef.current?.focus()}>
      <div className="kitty-body" ref={bodyRef}>
        {lines.map((l, i) =>
          l.kind === "out" ? (
            <div key={i} className="kitty-line">
              {l.text}
            </div>
          ) : (
            <AgnosterPrompt
              key={i}
              cwd={l.cwd}
              prevExit={l.prevExit}
              after={<span className="pl-cmd">{l.cmd}</span>}
            />
          ),
        )}
        <form
          className="kitty-prompt"
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
            setInput("");
          }}
        >
          <AgnosterPrompt
            cwd={cwd}
            prevExit={lastExit}
            after={
              <input
                ref={inputRef}
                className="pl-input"
                value={input}
                autoFocus
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const n = Math.min(histIdx + 1, hist.length - 1);
                    if (hist[n]) {
                      setHistIdx(n);
                      setInput(hist[n]);
                    }
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const n = histIdx - 1;
                    if (n < 0) {
                      setHistIdx(-1);
                      setInput("");
                    } else {
                      setHistIdx(n);
                      setInput(hist[n]);
                    }
                  }
                }}
                spellCheck={false}
                autoComplete="off"
              />
            }
          />
        </form>
      </div>
    </div>
  );
}
