"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SystemsBoard.module.css";

const INTERVAL_MS = 20000;
const HISTORY = 40;

function Sparkline({ points, ok }) {
    if (points.length < 2) {
        return <div className={styles.sparkEmpty} aria-hidden="true" />;
    }

    const width = 100;
    const height = 26;
    const max = Math.max(...points, 1);
    const step = width / (points.length - 1);
    const d = points
        .map((value, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(height - (value / max) * (height - 2) - 1).toFixed(2)}`)
        .join(" ");

    return (
        <svg
            className={styles.spark}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            <circle
                cx={width}
                cy={height - (points.at(-1) / max) * (height - 2) - 1}
                r="1.8"
                fill="currentColor"
            />
        </svg>
    );
}

const percentile = (values, p) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

export default function SystemsBoard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const historyRef = useRef({});
    const [, forceRender] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                const response = await fetch("/api/status", { cache: "no-store" });
                if (!response.ok) throw new Error(String(response.status));
                const payload = await response.json();
                if (cancelled) return;

                for (const service of payload.services) {
                    const bucket = (historyRef.current[service.id] ??= []);
                    bucket.push(service.ms);
                    if (bucket.length > HISTORY) bucket.shift();
                }
                setData(payload);
                setError(false);
                forceRender((n) => n + 1);
            } catch {
                if (!cancelled) setError(true);
            }
        };

        check();
        const id = setInterval(check, INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    const services = data?.services ?? [];
    const allUp = services.length > 0 && services.every((s) => s.ok);

    return (
        <div className={styles.wrap}>
            <div className={styles.head}>
                <span className={`${styles.beacon} ${allUp ? styles.beaconUp : styles.beaconWait}`} />
                <span className={styles.headline}>
                    {error
                        ? "probe failed"
                        : services.length === 0
                          ? "connecting…"
                          : allUp
                            ? "all systems operational"
                            : "degraded"}
                </span>
                {data && (
                    <span className={styles.build}>
                        {data.build.branch}@{data.build.commit} · {data.build.region} ·{" "}
                        {data.build.env}
                    </span>
                )}
            </div>

            <div className={styles.rows}>
                {services.length === 0 && !error && (
                    <div className={styles.skeleton} aria-hidden="true" />
                )}

                {services.map((service) => {
                    const points = historyRef.current[service.id] ?? [];
                    return (
                        <div
                            key={service.id}
                            className={`${styles.row} ${service.ok ? styles.up : styles.down}`}
                        >
                            <div className={styles.identity}>
                                <span className={styles.dot} />
                                <span className={styles.name}>{service.name}</span>
                                <span className={styles.detail}>{service.detail}</span>
                            </div>

                            <Sparkline points={points} ok={service.ok} />

                            <dl className={styles.metrics}>
                                <div>
                                    <dt>now</dt>
                                    <dd>{service.ms}ms</dd>
                                </div>
                                <div>
                                    <dt>p50</dt>
                                    <dd>{percentile(points, 50)}ms</dd>
                                </div>
                                <div>
                                    <dt>p95</dt>
                                    <dd>{percentile(points, 95)}ms</dd>
                                </div>
                                <div>
                                    <dt>http</dt>
                                    <dd>{service.status || "—"}</dd>
                                </div>
                            </dl>
                        </div>
                    );
                })}
            </div>

            <p className={styles.foot}>
                Probed server-side every {INTERVAL_MS / 1000}s from the edge region serving this
                page. Percentiles are over your session, not ours.
            </p>
        </div>
    );
}
