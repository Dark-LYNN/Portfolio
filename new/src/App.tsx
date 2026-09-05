import { useEffect } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import heroImg from "./assets/hero.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import "./App.css";
import Desktop from "./os/Desktop";

function Landing() {
  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Lynnux Portfolio</h1>
          <p>
            The interactive NixOS/Hyprland desktop lives at <code>/interactive</code>
          </p>
        </div>
        <Link to="/interactive" className="counter" style={{ textDecoration: "none" }}>
          Enter interactive desktop →
        </Link>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <h2>Desktop preview</h2>
          <p>Hyprland + Waybar (Madness) recreation in the browser</p>
          <ul>
            <li>
              <Link to="/interactive">
                <span>󰌧 Try /interactive</span>
              </Link>
            </li>
          </ul>
        </div>
        <div id="social">
          <h2>Links</h2>
          <p>Real portfolio links</p>
          <ul>
            <li>
              <a href="https://github.com/Dark-LYNN" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://lynnux.xyz" target="_blank" rel="noreferrer">
                lynnux.xyz
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

function RouteMode() {
  const loc = useLocation();
  useEffect(() => {
    document.getElementById("root")?.classList.toggle("os-mode", loc.pathname.startsWith("/interactive"));
  }, [loc.pathname]);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/interactive" element={<Desktop />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteMode />
    </BrowserRouter>
  );
}
