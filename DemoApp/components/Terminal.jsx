"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Terminal.module.css";

/* Split so the long host part can be dropped on narrow screens rather than
   overflowing the terminal. */
function Prompt() {
    return (
        <span className={styles.prompt}>
            <span className={styles.promptUser}>visitor@codingclub</span>:~$
        </span>
    );
}

const BOOT = [
    { kind: "dim", text: "webdev-vertical v0.2.0 — Coding Club, BITS Pilani" },
    { kind: "dim", text: "Type `help` to see what this thing does." },
];

const ROUTES = {
    frontend: { path: "/frontend", label: "Frontend Basics — Flexbox Monkey" },
    // /backend may redirect off-site, so it needs a full page load rather
    // than a client-side route change.
    backend: { path: "/backend", label: "Backend Basics — Django music app", hard: true },
};

const HELP = [
    ["help", "show this list"],
    ["ls", "list the available sessions"],
    ["cd <session>", "open a session (frontend, backend)"],
    ["stack", "what we cover across the semester"],
    ["whoami", "who is running this"],
    ["clear", "wipe the screen"],
];

const STACK = [
    "HTML · CSS · Flexbox · Grid",
    "JavaScript · DOM · fetch",
    "React · Next.js · component state",
    "Node.js · Express · REST",
    "Postgres · Prisma · auth",
    "Git · deploys · code review",
];

/** Everything the Tab key can complete. */
const COMPLETIONS = [
    "help",
    "ls",
    "cd frontend",
    "cd backend",
    "stack",
    "whoami",
    "clear",
];

let lineId = 0;
const line = (kind, text) => ({ id: ++lineId, kind, text });

export default function Terminal() {
    const router = useRouter();
    const [lines, setLines] = useState([]);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [cursor, setCursor] = useState(-1);
    const [busy, setBusy] = useState(false);

    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    /* Boot lines are added on the client so the server markup stays static.
       The timers are cleared on unmount, otherwise a remount (StrictMode does
       one in development) prints the banner a second time. */
    useEffect(() => {
        const timers = BOOT.map((entry, i) =>
            setTimeout(() => {
                setLines((prev) =>
                    prev.some((l) => l.text === entry.text)
                        ? prev
                        : [...prev, line(entry.kind, entry.text)]
                );
            }, 260 * i)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const node = scrollRef.current;
        if (node) node.scrollTop = node.scrollHeight;
    }, [lines, busy]);

    const print = (entries) => setLines((prev) => [...prev, ...entries]);

    function navigate(key) {
        const target = ROUTES[key];
        setBusy(true);
        print([line("ok", `opening ${target.label}…`)]);
        setTimeout(() => {
            if (target.hard) window.location.assign(target.path);
            else router.push(target.path);
        }, 550);
    }

    function run(raw) {
        const command = raw.trim();
        print([line("cmd", command)]);
        if (!command) return;

        setHistory((prev) => [command, ...prev]);
        setCursor(-1);

        const [verb, ...rest] = command.toLowerCase().split(/\s+/);
        const arg = rest.join(" ");

        switch (verb) {
            case "help":
                print(HELP.map(([name, desc]) => line("help", `${name.padEnd(14)}${desc}`)));
                break;

            case "ls":
                print([
                    line("out", "frontend/   Flexbox Monkey — a game for CSS layout"),
                    line("out", "backend/    Django music app — models, auth, templates"),
                ]);
                break;

            case "cd":
            case "open":
                if (ROUTES[arg]) {
                    navigate(arg);
                } else if (!arg) {
                    print([line("err", "cd: needs a session. Try `cd frontend`.")]);
                } else {
                    print([line("err", `cd: no such session: ${arg}`)]);
                }
                break;

            case "stack":
                print(STACK.map((item) => line("out", `· ${item}`)));
                break;

            case "whoami":
                print([
                    line("out", "The WebDev vertical of Coding Club, BITS Pilani."),
                    line("out", "We run hands-on sessions — you build, we review, it ships."),
                ]);
                break;

            case "clear":
                setLines([]);
                return;

            default:
                print([line("err", `command not found: ${verb} — try \`help\``)]);
        }
    }

    function onKeyDown(event) {
        if (busy) return;

        if (event.key === "Enter") {
            event.preventDefault();
            run(input);
            setInput("");
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
            const match = COMPLETIONS.find((c) => c.startsWith(input) && c !== input);
            if (match) setInput(match);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            const next = Math.min(cursor + 1, history.length - 1);
            if (next >= 0) {
                setCursor(next);
                setInput(history[next]);
            }
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            const next = cursor - 1;
            setCursor(next);
            setInput(next >= 0 ? history[next] : "");
        }
    }

    const ghost = input
        ? (COMPLETIONS.find((c) => c.startsWith(input) && c !== input) ?? "").slice(input.length)
        : "";

    return (
        <div className={styles.shell} onClick={() => inputRef.current?.focus()}>
            <div className={styles.bar}>
                <span className={styles.dots} aria-hidden="true">
                    <i /> <i /> <i />
                </span>
                <span className={styles.barTitle}>bash — webdev</span>
                <span className={styles.barHint}>Tab to complete</span>
            </div>

            <div ref={scrollRef} className={styles.screen}>
                {lines.map((entry) => (
                    <p key={entry.id} className={`${styles.line} ${styles[entry.kind]}`}>
                        {entry.kind === "cmd" && <Prompt />}
                        <span className={styles.text}>{entry.text}</span>
                    </p>
                ))}

                <div className={styles.inputRow}>
                    <Prompt />
                    <span className={styles.inputWrap}>
                        <input
                            ref={inputRef}
                            className={styles.input}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={busy}
                            spellCheck={false}
                            autoComplete="off"
                            autoCapitalize="off"
                            autoCorrect="off"
                            aria-label="Terminal input"
                        />
                        <span className={styles.mirror} aria-hidden="true">
                            {input}
                            {ghost && <span className={styles.ghost}>{ghost}</span>}
                            {!busy && <span className={styles.caret} />}
                        </span>
                    </span>
                </div>
            </div>

            <div className={styles.quick}>
                {["help", "ls", "cd frontend"].map((cmd) => (
                    <button
                        key={cmd}
                        type="button"
                        className={styles.chip}
                        onClick={() => {
                            if (busy) return;
                            run(cmd);
                            setInput("");
                            inputRef.current?.focus();
                        }}
                    >
                        {cmd}
                    </button>
                ))}
            </div>
        </div>
    );
}
