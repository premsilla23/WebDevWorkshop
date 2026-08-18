"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Playground from "@/components/Playground";
import Terminal from "@/components/Terminal";
import { BACKEND_URL, FRONTEND_URL, isExternal } from "@/lib/links";
import styles from "./page.module.css";

const TAGLINE = "$ build. break. ship. repeat.";

const STACK = [
    "HTML",
    "CSS",
    "Flexbox",
    "Grid",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "Postgres",
    "Git",
    "Docker",
];

const NODE_TAGS = ["0x01", "RUN", "ACK", "SYNC", "EXEC", "INIT"];

const SESSIONS = [
    {
        n: "01",
        href: FRONTEND_URL,
        title: "Frontend Basics",
        blurb: "Flexbox Monkey — a game where you write real CSS to move a monkey onto its target. Layout you can feel rather than memorise.",
        topics: ["display", "justify-content", "align-items", "flex-direction"],
        status: "live",
        cta: "open session",
        accent: "cyan",
    },
    {
        n: "02",
        href: BACKEND_URL,
        title: "Backend Basics",
        blurb: "A Django music app — artists, albums, playlists, likes and a full auth flow. The whole request → view → model → template path, running live.",
        topics: ["django", "models", "auth", "ORM", "templates"],
        status: "live",
        cta: "open the app",
        hardNav: true,
        accent: "purple",
    },
];

export default function Home() {
    const [typed, setTyped] = useState("");
    const [time, setTime] = useState("");
    const [nodes, setNodes] = useState([]);
    const heroRef = useRef(null);
    const rootRef = useRef(null);

    /* Typewriter for the tagline */
    useEffect(() => {
        let i = 0;
        const id = setInterval(() => {
            i += 1;
            setTyped(TAGLINE.slice(0, i));
            if (i >= TAGLINE.length) clearInterval(id);
        }, 45);
        return () => clearInterval(id);
    }, []);

    /* Live clock in the status bar */
    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    /* Reveal sections as they scroll into view */
    useEffect(() => {
        const targets = rootRef.current?.querySelectorAll("[data-reveal]");
        if (!targets?.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.dataset.shown = "true";
                    observer.unobserve(entry.target);
                }
            },
            { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
        );
        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    /* Mouse-tracked glow behind the hero */
    const handleMouseMove = (e) => {
        const el = heroRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };

    /* Clicking empty hero space drops a short-lived packet marker */
    const handleBackdropClick = (e) => {
        const el = heroRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const node = {
            id: `${e.clientX}-${e.clientY}-${nodes.length}-${performance.now()}`,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            tag: NODE_TAGS[Math.floor(Math.random() * NODE_TAGS.length)],
        };
        setNodes((prev) => [...prev.slice(-6), node]);
        setTimeout(() => setNodes((prev) => prev.filter((n) => n.id !== node.id)), 1200);
    };

    return (
        <div ref={rootRef} className={styles.page}>
            {/* ---------------------------- status bar ---------------------------- */}
            <div className={styles.statusBar}>
                <div className={styles.statusGroup}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    <span>SYSTEM ONLINE</span>
                    <span className={styles.divider}>/</span>
                    <span suppressHydrationWarning>{time || "00:00:00"}</span>
                    <span className={styles.divider}>/</span>
                    <span>BITS PILANI, RAJASTHAN</span>
                </div>
                <nav className={styles.statusNav}>
                    <a href="#playground">playground</a>
                    <a href="#sessions">sessions</a>
                </nav>
            </div>

            <main>
                {/* ------------------------------ hero ------------------------------ */}
                <section ref={heroRef} className={styles.hero} onMouseMove={handleMouseMove}>
                    <div
                        className={styles.heroBackdrop}
                        onClick={handleBackdropClick}
                        aria-hidden="true"
                    >
                        <svg
                            viewBox="0 0 800 400"
                            className={styles.circuit}
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

                    {nodes.map((n) => (
                        <span
                            key={n.id}
                            className={styles.pulse}
                            style={{ left: n.x, top: n.y }}
                            aria-hidden="true"
                        >
                            [{n.tag}]
                        </span>
                    ))}

                    <div className={styles.heroInner}>
                        <div className={styles.heroCopy}>
                            <span className={styles.eyebrow}>Coding Club · WebDev Vertical</span>

                            <h1 className={styles.title}>
                                CODING CLUB
                                <span className={styles.titleAccent}>BITS PILANI</span>
                            </h1>

                            <p className={styles.tagline}>
                                {typed}
                                <span className={styles.cursor} aria-hidden="true" />
                            </p>

                            <p className={styles.lede}>
                                Hands-on web development sessions. You write the code in the room,
                                it breaks in the room, and you fix it before you leave — starting
                                with the CSS layout model everybody claims to know.
                            </p>

                            <div className={styles.buttonRow}>
                                <Link href={FRONTEND_URL} className={styles.buttonPrimary}>
                                    <span className={styles.prompt}>~$</span>
                                    frontend-basics
                                    <span className={styles.arrow}>↵</span>
                                </Link>
                                <a href={BACKEND_URL} className={styles.buttonSecondary}>
                                    <span className={styles.prompt}>~$</span>
                                    backend-basics
                                    <span className={styles.arrow}>↵</span>
                                </a>
                            </div>
                        </div>

                        <div className={styles.heroTerminal}>
                            <Terminal />
                        </div>
                    </div>
                </section>

                {/* --------------------------- playground --------------------------- */}
                <section id="playground" className={styles.section} data-reveal>
                    <header className={styles.sectionHead}>
                        <div>
                            <span className={styles.sectionLabel}>01 / playground</span>
                            <h2 className={styles.sectionTitle}>
                                Edit the CSS. Watch it change.
                            </h2>
                        </div>
                        <p className={styles.sectionNote}>
                            A real editor and a real render — the same loop the sessions run on.
                            Change a value, break the layout, put it back.
                        </p>
                    </header>

                    <Playground />
                </section>

                {/* ---------------------------- sessions ---------------------------- */}
                <section id="sessions" className={styles.section} data-reveal>
                    <header className={styles.sectionHead}>
                        <div>
                            <span className={styles.sectionLabel}>02 / sessions</span>
                            <h2 className={styles.sectionTitle}>Where to start.</h2>
                        </div>
                        <p className={styles.sectionNote}>
                            Each session stands on its own. Open the one you need — no order is
                            enforced.
                        </p>
                    </header>

                    <div className={styles.sessions}>
                        {SESSIONS.map((session) => {
                            const external = isExternal(session.href);
                            const Card = external || session.hardNav ? "a" : Link;
                            const linkProps = external
                                ? { target: "_blank", rel: "noopener noreferrer" }
                                : {};

                            return (
                                <Card
                                    key={session.n}
                                    href={session.href}
                                    className={`${styles.session} ${styles[session.accent]}`}
                                    {...linkProps}
                                >
                                    <div className={styles.sessionTop}>
                                        <span className={styles.sessionNum}>{session.n}</span>
                                        <span
                                            className={`${styles.status} ${
                                                session.status === "live"
                                                    ? styles.statusLive
                                                    : styles.statusNext
                                            }`}
                                        >
                                            {session.status}
                                        </span>
                                    </div>

                                    <h3 className={styles.sessionTitle}>{session.title}</h3>
                                    <p className={styles.sessionBlurb}>{session.blurb}</p>

                                    <ul className={styles.topics}>
                                        {session.topics.map((topic) => (
                                            <li key={topic}>{topic}</li>
                                        ))}
                                    </ul>

                                    <span className={styles.sessionGo}>
                                        {session.cta}
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            {external ? (
                                                <>
                                                    <path d="M7 17 17 7M9 7h8v8" />
                                                </>
                                            ) : (
                                                <path d="M5 12h14M13 6l6 6-6 6" />
                                            )}
                                        </svg>
                                    </span>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* ----------------------------- marquee ----------------------------- */}
            <div className={styles.marquee}>
                <div className={styles.marqueeTrack}>
                    {[...STACK, ...STACK].map((tech, i) => (
                        <span key={i} className={styles.marqueeItem}>
                            {tech}
                            <span className={styles.marqueeDot}>•</span>
                        </span>
                    ))}
                </div>
            </div>

            <footer className={styles.footer}>
                <span>Coding Club, BITS Pilani — WebDev Vertical</span>
                <span className={styles.footerMeta}>built for the workshop</span>
            </footer>
        </div>
    );
}
