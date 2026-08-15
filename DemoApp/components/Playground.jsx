"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Playground.module.css";

const PRESETS = {
    flex: {
        label: "flexbox",
        html: `<div class="row">
  <div class="box">1</div>
  <div class="box">2</div>
  <div class="box">3</div>
</div>`,
        css: `.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  height: 140px;
}

.box {
  flex: 1;
  display: grid;
  place-items: center;
  height: 64px;
  border-radius: 10px;
  background: #5eead4;
  color: #08240f;
  font-weight: 700;
}`,
    },
    card: {
        label: "card",
        html: `<article class="card">
  <span class="tag">workshop</span>
  <h2>Session 01</h2>
  <p>Build a layout from scratch, then break it on purpose.</p>
  <button>Join in</button>
</article>`,
        css: `.card {
  max-width: 260px;
  padding: 20px;
  border-radius: 14px;
  background: #10151d;
  border: 1px solid #ffffff1a;
  color: #edeff2;
  font-family: system-ui, sans-serif;
}

.tag {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #e45dff;
}

h2 { margin: 8px 0 6px; font-size: 20px; }
p  { margin: 0 0 16px; color: #8b95a1; font-size: 14px; }

button {
  border: 0;
  border-radius: 8px;
  padding: 9px 14px;
  background: #5eead4;
  color: #062b23;
  font-weight: 600;
  cursor: pointer;
}`,
    },
    grid: {
        label: "grid",
        html: `<div class="grid">
  <div class="cell a">a</div>
  <div class="cell">b</div>
  <div class="cell">c</div>
  <div class="cell">d</div>
</div>`,
        css: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 70px;
  gap: 10px;
}

.cell {
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #161d27;
  border: 1px solid #ffffff14;
  color: #8b95a1;
  font-family: monospace;
}

.a {
  grid-column: 1 / 3;
  background: #e45dff;
  color: #2a0733;
}`,
    },
};

const ORDER = ["flex", "card", "grid"];

const FRAME_BASE = `*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  padding: 18px;
  background: #0b0f14;
  color: #edeff2;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}`;

export default function Playground() {
    const [preset, setPreset] = useState("flex");
    const [tab, setTab] = useState("css");
    const [code, setCode] = useState(PRESETS.flex);
    const [debounced, setDebounced] = useState(PRESETS.flex);
    const editorRef = useRef(null);

    /* Repaint the preview a beat after typing stops. */
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(code), 260);
        return () => clearTimeout(timer);
    }, [code]);

    const srcDoc = useMemo(
        () =>
            `<!doctype html><html><head><meta charset="utf-8"><style>${FRAME_BASE}\n${debounced.css}</style></head><body>${debounced.html}</body></html>`,
        [debounced]
    );

    function load(key) {
        setPreset(key);
        setCode(PRESETS[key]);
    }

    function onKeyDown(event) {
        if (event.key !== "Tab") return;
        event.preventDefault();
        const el = event.currentTarget;
        const { selectionStart: start, selectionEnd: end, value } = el;
        const next = `${value.slice(0, start)}  ${value.slice(end)}`;
        setCode((prev) => ({ ...prev, [tab]: next }));
        queueMicrotask(() => el.setSelectionRange(start + 2, start + 2));
    }

    const lines = code[tab].split("\n").length;

    return (
        <div className={styles.wrap}>
            <div className={styles.toolbar}>
                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={`${styles.tab} ${tab === "html" ? styles.tabOn : ""}`}
                        onClick={() => setTab("html")}
                    >
                        index.html
                    </button>
                    <button
                        type="button"
                        className={`${styles.tab} ${tab === "css" ? styles.tabOn : ""}`}
                        onClick={() => setTab("css")}
                    >
                        style.css
                    </button>
                </div>

                <div className={styles.presets}>
                    {ORDER.map((key) => (
                        <button
                            key={key}
                            type="button"
                            className={`${styles.preset} ${preset === key ? styles.presetOn : ""}`}
                            onClick={() => load(key)}
                        >
                            {PRESETS[key].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.panes}>
                <div className={styles.editor}>
                    <div className={styles.gutter} aria-hidden="true">
                        {Array.from({ length: lines }, (_, i) => (
                            <span key={i}>{i + 1}</span>
                        ))}
                    </div>
                    <textarea
                        ref={editorRef}
                        className={styles.code}
                        value={code[tab]}
                        onChange={(e) => setCode((prev) => ({ ...prev, [tab]: e.target.value }))}
                        onKeyDown={onKeyDown}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        aria-label={tab === "css" ? "CSS editor" : "HTML editor"}
                    />
                </div>

                <div className={styles.preview}>
                    <div className={styles.previewBar}>
                        <span className={styles.previewDot} aria-hidden="true" />
                        <span>live preview</span>
                    </div>
                    <iframe
                        className={styles.frame}
                        title="Live preview"
                        sandbox=""
                        srcDoc={srcDoc}
                    />
                </div>
            </div>
        </div>
    );
}
