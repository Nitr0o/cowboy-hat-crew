import React, { useEffect, useState } from "react";
import "./App.css";

const SITE = {
  name: "The Cowboy Hat Crew",
  ip: "172.96.164.77",
  queryPort: "2312", // BattleMetrics / query API port
  gamePort: "2302",  // The actual join port for players
  discord: "https://discord.gg/pBFhVFm2bd",
  mods: [
    { name: "Bunker", url: "https://steamcommunity.com/workshop/browse/?appid=221100&searchtext=Bunker" },
    { name: "Horses", url: "https://steamcommunity.com/workshop/browse/?appid=221100&searchtext=Horses" },
    { name: "1PP", url: "https://steamcommunity.com/workshop/browse/?appid=221100&searchtext=1PP" },
    { name: "Mortys Guns", url: "https://steamcommunity.com/workshop/browse/?appid=221100&searchtext=Morty%20Guns" },
    { name: "CJ187-SummerChernarus", url: "https://steamcommunity.com/sharedfiles/filedetails/?id=1644467354" },
    { name: "Ear-Plugs", url: "https://steamcommunity.com/sharedfiles/filedetails/?id=1819514788" },
    { name: "Give & Take", url: "https://steamcommunity.com/sharedfiles/filedetails/?id=2903112334" },
  ],
  rules: [
    "No cheating/exploits/duplication.",
    "No stream sniping.",
    "Respect other players — no hate speech.",
    "Report bugs in Discord and tag an admin.",
  ],
};

// Steam deep link for DayZ (app 221100)
const steamConnect = `steam://run/221100//%20-connect=${SITE.ip}%20-port=${SITE.gamePort}`;

// Backgrounds from /public/bg
const BACKGROUNDS = Array.from({ length: 18 }, (_, i) => `/bg/${i + 1}.png`);

function RotatingBackground({ images, intervalMs = 10000 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div className="rotating-bg-container">
      {images.map((src, i) => (
        <div
          key={i}
          className={`rotating-bg-slide ${i === current ? "active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
}


function StatusBadge({ online, players, max }) {
  const isOnline =
    online === true ||
    online === "true" ||
    online === 1 ||
    online === "1" ||
    online === "online" ||
    online === "running";

  if (online === null || online === undefined) {
    return <span className="status-pill">Checking…</span>;
  }
  if (!isOnline) {
    return <span className="status-pill bad">Offline</span>;
  }
  return (
    <span className="status-pill online">
      Online • {players != null ? players : 0}/{max != null ? max : "?"} players
    </span>
  );
}

function Button({ href, onClick, children }) {
  const isWeb = href && href.startsWith("http");
  return (
    <a
      className="btn"
      href={href}
      onClick={onClick}
      {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export default function App() {
  const [status, setStatus] = useState({
    online: null,
    players: null,
    max: null,
    name: null,
    map: null,
  });

  const [copied, setCopied] = useState(false);
  function copyIp() {
    const text = `${SITE.ip}:${SITE.gamePort}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  useEffect(() => {
    let alive = true;
    async function fetchStatus() {
      try {
        const res = await fetch(
          `/.netlify/functions/status?ip=${SITE.ip}&port=${SITE.queryPort}`
        );
        const data = await res.json();
        if (alive) {
          setStatus((prev) => ({
            ...prev,
            ...data,
            online:
              data.online === true ||
              data.online === "true" ||
              data.status === "online" ||
              data.status === "running",
          }));
        }
      } catch {
        if (alive) setStatus((prev) => ({ ...prev, online: false }));
      }
    }
    fetchStatus();
    const id = setInterval(fetchStatus, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="page">
      {/* LEFT COLUMN */}
      <div className="left-column">
        <img src="/logo.png" alt="Logo" style={{ width: "180px" }} />
        <h1 style={{ margin: "6px 0 0 0", textAlign: "center" }}>{SITE.name}</h1>

        <div>
          <Button href={steamConnect}>Connect</Button>
          <Button href={SITE.discord}>Discord</Button>
          <Button onClick={copyIp}>{copied ? "Copied!" : "Copy IP"}</Button>
        </div>

        <StatusBadge
          online={status.online}
          players={status.players}
          max={status.max}
        />

        <div className="card">
          <p><b>Server:</b> {SITE.ip}:{SITE.queryPort}</p>
          <p>
            <b>Name:</b>{" "}
            {(status.name || SITE.name).replace(/\|\s*$/, "")}
          </p>
          <p><b>Map:</b> {status.map || "Chernarus"}</p>
          <small>Status updates every 30 seconds.</small>
        </div>
      </div>

      {/* CENTER BACKGROUND */}
      <div className="center-column">
        <RotatingBackground images={BACKGROUNDS} />
      </div>

      {/* RIGHT COLUMN */}
      <div className="right-stack">
        <div className="card">
          <h2>News & Events</h2>
          <ul style={{ marginTop: 8, lineHeight: 1.6 }}>
            <li>Server is currently live for playtesting</li>
            <li></li>
            <li>Report bugs in Discord.</li>
          </ul>
        </div>

        <div className="card">
          <h2>Rules</h2>
          <ol style={{ marginTop: 8, lineHeight: 1.6, paddingLeft: 18 }}>
            {SITE.rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h2>Mods</h2>
          <ul className="mods-list">
            {SITE.mods.map((m) => (
              <li key={m.name}>
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  {m.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
