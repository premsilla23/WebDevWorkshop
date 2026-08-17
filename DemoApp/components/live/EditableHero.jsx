"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./EditableHero.module.css";

const DEFAULTS = {
    accent: "#5eead4",
    size: 3.4,
    weight: 800,
    tracking: -3,
    radius: 8,
};

const DEFAULT_HEADLINE = "You can change this.";

const SWATCHES = ["#5eead4", "#e45dff", "#fbbf24", "#4ade80", "#ff7b72", "#7aa2f7"];

/**
 * The controls below do not "simulate" anything: they build the rule set once,
 * which is then both rendered as the visible stylesheet *and* serialised into
 * the <style> tag that actually paints this section. One source of truth, so
 * the code panel can never drift from what you are looking at.
 */
function buildRules({ accent, size, weight, tracking, radius }) {
    return [
        {
            selector: "#hero h1",
            decls: [
                ["color", accent],
                ["font-size", `${size}rem`],
                ["font-weight", String(weight)],
                ["letter-spacing", `${(tracking / 100).toFixed(2)}em`],
            ],
        },
        {
            selector: "#hero .button",
            decls: [
                ["background", accent],
                ["border-radius", `${radius}px`],
            ],
        },
    ];
}

const serialise = (rules) =>
    rules
        .map(
            ({ selector, decls }) =>
                `${selector} {\n${decls.map(([p, v]) => `  ${p}: ${v};`).join("\n")}\n}`
        )
        .join("\n\n");

function Slider({ label, value, min, max, step = 1, suffix, onChange }) {
    return (
        <label className={styles.control}>
            <span className={styles.controlHead}>
                {label}
                <b>
                    {value}
                    {suffix}
                </b>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </label>
    );
}

export default function EditableHero() {
    const [style, setStyle] = useState(DEFAULTS);
    const [headlineKey, setHeadlineKey] = useState(0);
    const [touched, setTouched] = useState(false);
    const headlineRef = useRef(null);

    const rules = useMemo(() => buildRules(style), [style]);
    const css = useMemo(() => serialise(rules), [rules]);

    const set = (key) => (value) => {
        setTouched(true);
        setStyle((prev) => ({ ...prev, [key]: value }));
    };

    const reset = () => {
        setStyle(DEFAULTS);
        setHeadlineKey((n) => n + 1);
        setTouched(false);
    };

    return (
        <div className={styles.wrap}>
            {/* This really is the stylesheet for the section below. */}
            <style dangerouslySetInnerHTML={{ __html: css }} />

            <section id="hero" className={styles.stage}>
                <p className={styles.eyebrow}>
                    <span className={styles.dot} aria-hidden="true" />
                    Coding Club · BITS Pilani — WebDev
                </p>

                <h1
                    key={headlineKey}
                    ref={headlineRef}
                    className={styles.headline}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onInput={() => setTouched(true)}
                    aria-label="Editable headline"
                >
                    {DEFAULT_HEADLINE}
                </h1>

                <p className={styles.lede}>
                    Every website is text a browser reads. Drag a slider, pick a colour, click the
                    heading and type your own name — you are editing the page you are standing on.
                    That is the whole job.
                </p>

                <span className={`${styles.button} button`}>join the workshop</span>

                <span className={styles.hint}>
                    {touched ? "you're writing CSS →" : "try clicking the heading"}
                </span>
            </section>

            <aside className={styles.panel}>
                <div className={styles.controls}>
                    <div className={styles.control}>
                        <span className={styles.controlHead}>
                            colour <b>{style.accent}</b>
                        </span>
                        <div className={styles.swatches}>
                            {SWATCHES.map((hex) => (
                                <button
                                    key={hex}
                                    type="button"
                                    aria-label={`Use ${hex}`}
                                    className={`${styles.swatch} ${
                                        style.accent === hex ? styles.swatchOn : ""
                                    }`}
                                    style={{ background: hex }}
                                    onClick={() => set("accent")(hex)}
                                />
                            ))}
                            <input
                                type="color"
                                className={styles.picker}
                                value={style.accent}
                                onChange={(e) => set("accent")(e.target.value)}
                                aria-label="Pick any colour"
                            />
                        </div>
                    </div>

                    <Slider
                        label="size"
                        value={style.size}
                        min={1.6}
                        max={6}
                        step={0.1}
                        suffix="rem"
                        onChange={set("size")}
                    />
                    <Slider
                        label="weight"
                        value={style.weight}
                        min={300}
                        max={900}
                        step={100}
                        onChange={set("weight")}
                    />
                    <Slider
                        label="letter-spacing"
                        value={style.tracking}
                        min={-8}
                        max={20}
                        suffix="/100em"
                        onChange={set("tracking")}
                    />
                    <Slider
                        label="corner radius"
                        value={style.radius}
                        min={0}
                        max={28}
                        suffix="px"
                        onChange={set("radius")}
                    />
                </div>

                <div className={styles.code}>
                    <div className={styles.codeBar}>
                        <span className={styles.file}>style.css</span>
                        <span className={styles.live}>
                            <i aria-hidden="true" /> applied live
                        </span>
                        <button type="button" className={styles.reset} onClick={reset}>
                            reset
                        </button>
                    </div>

                    <pre className={styles.pre}>
                        {rules.map((rule, i) => (
                            <span key={rule.selector}>
                                {i > 0 && "\n"}
                                <span className={styles.sel}>{rule.selector}</span>
                                <span className={styles.punc}> {"{"}</span>
                                {"\n"}
                                {rule.decls.map(([prop, value]) => (
                                    <span key={prop}>
                                        {"  "}
                                        <span className={styles.prop}>{prop}</span>
                                        <span className={styles.punc}>: </span>
                                        <span className={styles.val}>{value}</span>
                                        <span className={styles.punc}>;</span>
                                        {"\n"}
                                    </span>
                                ))}
                                <span className={styles.punc}>{"}"}</span>
                                {"\n"}
                            </span>
                        ))}
                    </pre>
                </div>
            </aside>
        </div>
    );
}
