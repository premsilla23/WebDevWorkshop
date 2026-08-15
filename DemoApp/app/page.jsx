"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const TAGLINE = "$ build. break. ship. repeat.";
const STACK = [
  "JavaScript",
  "React",
  "Python",
  "Node.js",
  "C++",
  "Docker",
];

const NODE_TAGS = ["0x01", "RUN", "ACK", "SYNC", "EXEC", "INIT"];

export default function Home() {
  const [typed, setTyped] = useState("");
  const [time, setTime] = useState("");
  const [nodes, setNodes] = useState([]);
  const [copiedTech, setCopiedTech] = useState(null);
  const heroRef = useRef(null);

  // Typewriter effect for the tagline
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(TAGLINE.slice(0, i));
      if (i >= TAGLINE.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, []);

  // Live "system clock" in the status bar
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Mouse-tracked glow behind hero
  const handleMouseMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  // Click interactive node spawning
  const handleHeroClick = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tag = NODE_TAGS[Math.floor(Math.random() * NODE_TAGS.length)];
    const newNode = { id: Date.now(), x, y, tag };

    setNodes((prev) => [...prev.slice(-6), newNode]);

    setTimeout(() => {
      setNodes((prev) => prev.filter((n) => n.id !== newNode.id));
    }, 1200);
  };

  // Synthetic sound generator for terminal buttons
  const playClickFx = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context ignored if restricted
    }
  };

  const handleCopyTech = (tech) => {
    navigator.clipboard.writeText(tech);
    setCopiedTech(tech);
    setTimeout(() => setCopiedTech(null), 1500);
  };

  return (
    <main className={styles.main}>
      <div className={styles.statusBar}>
        <span className={styles.statusDot} aria-hidden="true" />
        <span>SYSTEM ONLINE</span>
        <span className={styles.statusDivider}>/</span>
        <span suppressHydrationWarning>{time || "00:00:00"}</span>
        <span className={styles.statusDivider}>/</span>
        <span>BITS PILANI, RAJASTHAN</span>
      </div>

      <section
        ref={heroRef}
        className={styles.hero}
        onMouseMove={handleMouseMove}
        onClick={handleHeroClick}
      >
        <div className={styles.circuitBg} aria-hidden="true">
          <svg
            viewBox="0 0 800 400"
            className={styles.circuitSvg}
            preserveAspectRatio="none"
          >
            <path className={styles.trace} d="M0 60 H180 V160 H420 V40 H800" />
            <path
              className={styles.trace}
              d="M0 340 H240 V220 H520 V300 H800"
              style={{ animationDelay: "1.1s" }}
            />
            <path
              className={styles.trace}
              d="M0 200 H120 V120 H320 V260 H620 V180 H800"
              style={{ animationDelay: "2.2s" }}
            />
          </svg>
        </div>

        {/* Dynamic Nodes Spawned on Click */}
        {nodes.map((n) => (
          <div
            key={n.id}
            className={styles.clickPulse}
            style={{ left: n.x, top: n.y }}
          >
            <span className={styles.pulseTag}>[{n.tag}]</span>
          </div>
        ))}

        <h1 className={styles.title}>
          CODING CLUB
          <span className={styles.titleAccent}>BITS PILANI</span>
          <span className={styles.titleSubheader}>WebDev Vertical</span>
        </h1>

        <p className={styles.tagline}>
          {typed}
          <span className={styles.cursor} aria-hidden="true" />
        </p>

        <div className={styles.buttonRow}>
          <Link href="/frontend" className={styles.linkWrap}>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={playClickFx}
            >
              <span className={styles.prompt}>~$</span>
              frontend-basics
              <span className={styles.arrow}>↵</span>
            </button>
          </Link>
          <Link href="/backend" className={styles.linkWrap}>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={playClickFx}
            >
              <span className={styles.prompt}>~$</span>
              backend-basics
              <span className={styles.arrow}>↵</span>
            </button>
          </Link>
        </div>
      </section>

      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          {[...STACK, ...STACK].map((tech, idx) => (
            <span
              key={idx}
              className={styles.marqueeItem}
              onClick={() => handleCopyTech(tech)}
              role="button"
              tabIndex={0}
            >
              {tech}
              <span className={styles.marqueeDot}>
                {copiedTech === tech ? "✓" : "•"}
              </span>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}