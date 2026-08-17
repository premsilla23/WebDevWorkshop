"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    ALGORITHMS,
    EMPTY,
    WALL,
    WEIGHT,
    WEIGHT_COST,
    generateField,
    generateMaze,
} from "@/lib/pathfinding";
import styles from "./PathfindingLab.module.css";

const COLS = 29;
const ROWS = 19;
const CELLS = COLS * ROWS;

const START = 9 * COLS + 2;
const GOAL = 9 * COLS + (COLS - 3);

const BRUSHES = [
    { id: "wall", label: "wall", hint: "impassable" },
    { id: "weight", label: `weight ×${WEIGHT_COST}`, hint: "costly to cross" },
    { id: "erase", label: "erase", hint: "clear a cell" },
];

const PALETTE = {
    empty: "#0a0e14",
    wall: "#212b38",
    weightFill: "rgba(251, 191, 36, 0.13)",
    weightDot: "rgba(251, 191, 36, 0.55)",
    grid: "rgba(237, 239, 242, 0.045)",
    start: "#4ade80",
    goal: "#edeff2",
};

export default function PathfindingLab() {
    const canvasRefs = useRef({});
    const statRefs = useRef({});
    const gridRef = useRef(new Uint8Array(CELLS));
    const startRef = useRef(START);
    const goalRef = useRef(GOAL);
    const resultsRef = useRef(null);
    const frameRef = useRef(0);
    const rafRef = useRef(0);
    const dragRef = useRef(null);

    const [brush, setBrush] = useState("wall");
    const [speed, setSpeed] = useState(6);
    const [summary, setSummary] = useState(null);
    const speedRef = useRef(speed);
    speedRef.current = speed;

    /* ---------------------------------------------------------------- *
     * Drawing
     * ---------------------------------------------------------------- */
    const paint = useCallback((algoId) => {
        const canvas = canvasRefs.current[algoId];
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.clientWidth;
        const cell = width / COLS;
        const height = cell * ROWS;

        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.height = `${height}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const grid = gridRef.current;
        const algo = ALGORITHMS.find((a) => a.id === algoId);
        const outcome = resultsRef.current?.[algoId];
        const progress = frameRef.current;

        ctx.fillStyle = PALETTE.empty;
        ctx.fillRect(0, 0, width, height);

        // terrain
        for (let i = 0; i < CELLS; i += 1) {
            const x = (i % COLS) * cell;
            const y = ((i / COLS) | 0) * cell;
            if (grid[i] === WALL) {
                ctx.fillStyle = PALETTE.wall;
                ctx.fillRect(x, y, cell, cell);
            } else if (grid[i] === WEIGHT) {
                ctx.fillStyle = PALETTE.weightFill;
                ctx.fillRect(x, y, cell, cell);
            }
        }

        // explored frontier
        if (outcome) {
            const upTo = Math.min(progress, outcome.visited.length);
            for (let i = 0; i < upTo; i += 1) {
                const index = outcome.visited[i];
                if (index === startRef.current || index === goalRef.current) continue;
                const x = (index % COLS) * cell;
                const y = ((index / COLS) | 0) * cell;
                // the newest cells glow brighter, so the wavefront is visible
                const age = (upTo - i) / Math.max(upTo, 1);
                ctx.globalAlpha = 0.16 + 0.5 * (1 - age);
                ctx.fillStyle = algo.tone;
                ctx.fillRect(x, y, cell, cell);
            }
            ctx.globalAlpha = 1;

            // the path, drawn once exploration has finished
            if (progress > outcome.visited.length && outcome.found) {
                const drawn = Math.min(progress - outcome.visited.length, outcome.path.length);
                ctx.strokeStyle = algo.tone;
                ctx.lineWidth = Math.max(2, cell * 0.34);
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                ctx.beginPath();
                for (let i = 0; i < drawn; i += 1) {
                    const index = outcome.path[i];
                    const x = (index % COLS) * cell + cell / 2;
                    const y = ((index / COLS) | 0) * cell + cell / 2;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }

        // weight markers sit above the frontier so they stay legible
        for (let i = 0; i < CELLS; i += 1) {
            if (grid[i] !== WEIGHT) continue;
            const x = (i % COLS) * cell + cell / 2;
            const y = ((i / COLS) | 0) * cell + cell / 2;
            ctx.fillStyle = PALETTE.weightDot;
            ctx.beginPath();
            ctx.arc(x, y, Math.max(1, cell * 0.12), 0, Math.PI * 2);
            ctx.fill();
        }

        // grid lines
        ctx.strokeStyle = PALETTE.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let c = 1; c < COLS; c += 1) {
            ctx.moveTo(Math.round(c * cell) + 0.5, 0);
            ctx.lineTo(Math.round(c * cell) + 0.5, height);
        }
        for (let r = 1; r < ROWS; r += 1) {
            ctx.moveTo(0, Math.round(r * cell) + 0.5);
            ctx.lineTo(width, Math.round(r * cell) + 0.5);
        }
        ctx.stroke();

        // endpoints
        const marker = (index, color) => {
            const x = (index % COLS) * cell;
            const y = ((index / COLS) | 0) * cell;
            ctx.fillStyle = color;
            ctx.fillRect(x + cell * 0.16, y + cell * 0.16, cell * 0.68, cell * 0.68);
        };
        marker(startRef.current, PALETTE.start);
        marker(goalRef.current, PALETTE.goal);
    }, []);

    const paintAll = useCallback(() => {
        for (const algo of ALGORITHMS) paint(algo.id);
    }, [paint]);

    /* ---------------------------------------------------------------- *
     * Running the race
     * ---------------------------------------------------------------- */
    const writeStats = useCallback(() => {
        const progress = frameRef.current;
        for (const algo of ALGORITHMS) {
            const outcome = resultsRef.current?.[algo.id];
            const node = statRefs.current[algo.id];
            if (!outcome || !node) continue;
            const explored = Math.min(progress, outcome.visited.length);
            node.explored.textContent = String(explored);
            const settled = progress > outcome.visited.length;
            node.cost.textContent = settled
                ? outcome.found
                    ? String(outcome.cost)
                    : "—"
                : "…";
        }
    }, []);

    const run = useCallback(() => {
        cancelAnimationFrame(rafRef.current);

        const grid = gridRef.current;
        const start = startRef.current;
        const goal = goalRef.current;

        const results = {};
        for (const algo of ALGORITHMS) {
            results[algo.id] = algo.run(grid, COLS, ROWS, start, goal);
        }
        resultsRef.current = results;
        frameRef.current = 0;
        setSummary(null);

        const longest = Math.max(
            ...ALGORITHMS.map((a) => results[a.id].visited.length + results[a.id].path.length)
        );

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) {
            frameRef.current = longest + 1;
            paintAll();
            writeStats();
            setSummary(results);
            return;
        }

        const tick = () => {
            frameRef.current += speedRef.current;
            paintAll();
            writeStats();
            if (frameRef.current <= longest) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setSummary(results);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [paintAll, writeStats]);

    /* ---------------------------------------------------------------- *
     * Setup
     * ---------------------------------------------------------------- */
    useEffect(() => {
        gridRef.current = generateField(COLS, ROWS);
        gridRef.current[startRef.current] = EMPTY;
        gridRef.current[goalRef.current] = EMPTY;
        run();

        const onResize = () => paintAll();
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            cancelAnimationFrame(rafRef.current);
        };
    }, [run, paintAll]);

    /* ---------------------------------------------------------------- *
     * Editing the grid
     * ---------------------------------------------------------------- */
    const cellFromEvent = (event, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const cell = rect.width / COLS;
        const x = Math.floor((event.clientX - rect.left) / cell);
        const y = Math.floor((event.clientY - rect.top) / cell);
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return -1;
        return y * COLS + x;
    };

    const applyBrush = (index) => {
        if (index < 0 || index === startRef.current || index === goalRef.current) return;
        const grid = gridRef.current;
        const next = brush === "wall" ? WALL : brush === "weight" ? WEIGHT : EMPTY;
        if (grid[index] === next) return;
        grid[index] = next;
        paintAll();
    };

    const onPointerDown = (event, algoId) => {
        const canvas = canvasRefs.current[algoId];
        const index = cellFromEvent(event, canvas);
        if (index < 0) return;
        canvas.setPointerCapture(event.pointerId);

        if (index === startRef.current) dragRef.current = "start";
        else if (index === goalRef.current) dragRef.current = "goal";
        else {
            dragRef.current = "brush";
            applyBrush(index);
        }
    };

    const onPointerMove = (event, algoId) => {
        if (!dragRef.current) return;
        const index = cellFromEvent(event, canvasRefs.current[algoId]);
        if (index < 0) return;

        if (dragRef.current === "brush") {
            applyBrush(index);
            return;
        }
        const other = dragRef.current === "start" ? goalRef.current : startRef.current;
        if (index === other) return;
        gridRef.current[index] = EMPTY;
        if (dragRef.current === "start") startRef.current = index;
        else goalRef.current = index;
        paintAll();
    };

    const onPointerUp = () => {
        if (!dragRef.current) return;
        dragRef.current = null;
        run();
    };

    const clear = () => {
        gridRef.current = new Uint8Array(CELLS);
        run();
    };

    const regenerate = (kind) => {
        gridRef.current =
            kind === "maze" ? generateMaze(COLS, ROWS) : generateField(COLS, ROWS);
        gridRef.current[startRef.current] = EMPTY;
        gridRef.current[goalRef.current] = EMPTY;
        run();
    };

    const winner =
        summary &&
        ALGORITHMS.map((a) => ({ id: a.id, name: a.name, n: summary[a.id].explored })).sort(
            (a, b) => a.n - b.n
        )[0];
    const worst =
        summary &&
        ALGORITHMS.map((a) => ({ id: a.id, name: a.name, n: summary[a.id].explored })).sort(
            (a, b) => b.n - a.n
        )[0];
    const ratio = winner && worst ? worst.n / Math.max(winner.n, 1) : 1;

    return (
        <div className={styles.wrap}>
            <div className={styles.controls}>
                <div className={styles.brushes}>
                    {BRUSHES.map((b) => (
                        <button
                            key={b.id}
                            type="button"
                            title={b.hint}
                            className={`${styles.brush} ${brush === b.id ? styles.brushOn : ""}`}
                            onClick={() => setBrush(b.id)}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>

                <label className={styles.speed}>
                    speed
                    <input
                        type="range"
                        min="1"
                        max="24"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                    />
                </label>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.action}
                        onClick={() => regenerate("field")}
                    >
                        new field
                    </button>
                    <button
                        type="button"
                        className={styles.action}
                        title="A perfect maze has one corridor, so the heuristic stops helping"
                        onClick={() => regenerate("maze")}
                    >
                        maze
                    </button>
                    <button type="button" className={styles.action} onClick={clear}>
                        clear
                    </button>
                    <button type="button" className={styles.run} onClick={run}>
                        run ↵
                    </button>
                </div>
            </div>

            <div className={styles.panels}>
                {ALGORITHMS.map((algo) => (
                    <figure key={algo.id} className={styles.panel}>
                        <figcaption className={styles.panelHead}>
                            <span className={styles.panelName} style={{ color: algo.tone }}>
                                {algo.name}
                            </span>
                            <span className={styles.panelStats}>
                                <span
                                    ref={(node) => {
                                        statRefs.current[algo.id] ??= {};
                                        statRefs.current[algo.id].explored = node;
                                    }}
                                    className={styles.statValue}
                                >
                                    0
                                </span>
                                <span className={styles.statLabel}>explored</span>
                                <span
                                    ref={(node) => {
                                        statRefs.current[algo.id] ??= {};
                                        statRefs.current[algo.id].cost = node;
                                    }}
                                    className={styles.statValue}
                                >
                                    …
                                </span>
                                <span className={styles.statLabel}>cost</span>
                            </span>
                        </figcaption>

                        <canvas
                            ref={(node) => {
                                canvasRefs.current[algo.id] = node;
                            }}
                            className={styles.canvas}
                            onPointerDown={(e) => onPointerDown(e, algo.id)}
                            onPointerMove={(e) => onPointerMove(e, algo.id)}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                        />

                        <p className={styles.note}>{algo.note}</p>
                    </figure>
                ))}
            </div>

            <p className={styles.readout} aria-live="polite">
                {summary && winner && worst ? (
                    ratio >= 1.35 ? (
                        <>
                            <strong
                                style={{ color: ALGORITHMS.find((a) => a.id === winner.id).tone }}
                            >
                                {winner.name}
                            </strong>{" "}
                            settled {winner.n} nodes against {worst.name}&apos;s {worst.n} —{" "}
                            {ratio.toFixed(1)}× fewer for the same answer. Drag the endpoints or
                            paint terrain; it re-runs on release.
                        </>
                    ) : (
                        <>
                            All three settled roughly the same number of nodes ({winner.n}–
                            {worst.n}). That happens when the terrain leaves only one viable
                            route — a heuristic has nothing to exploit. Try{" "}
                            <strong>new field</strong> for open ground.
                        </>
                    )
                ) : (
                    <>Paint on any grid to edit all three. They share one terrain.</>
                )}
            </p>
        </div>
    );
}
