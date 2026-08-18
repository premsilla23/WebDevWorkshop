"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./AsciiCam.module.css";

/* Ramps run darkest → lightest; the pixel's brightness picks the index. */
const RAMPS = {
    classic: "@%#*+=-:. ",
    blocks: "█▓▒░ ",
    dots: "@8Oo=~-. ",
    code: "#{}[]()<>/*-. ",
};

const RAMP_ORDER = ["classic", "blocks", "dots", "code"];

const IDLE = "idle";
const ASKING = "asking";
const LIVE = "live";
const DENIED = "denied";
const UNSUPPORTED = "unsupported";

export default function AsciiCam() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const outputRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(0);
    const lastFrameRef = useRef(0);

    const [state, setState] = useState(IDLE);
    const [cols, setCols] = useState(90);
    const [ramp, setRamp] = useState("classic");
    const [invert, setInvert] = useState(false);
    const [copied, setCopied] = useState(false);

    // The render loop reads these through a ref so changing a control never
    // restarts the camera. Written in an effect — mutating a ref during render
    // is not safe under concurrent rendering.
    const settings = useRef({ cols, ramp, invert });
    useEffect(() => {
        settings.current = { cols, ramp, invert };
    }, [cols, ramp, invert]);

    const stop = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (outputRef.current) outputRef.current.textContent = "";
        setState(IDLE);
    }, []);

    useEffect(() => () => stop(), [stop]);

    const start = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setState(UNSUPPORTED);
            return;
        }

        setState(ASKING);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });
            streamRef.current = stream;

            const video = videoRef.current;
            video.srcObject = stream;
            await video.play();
            setState(LIVE);

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            const draw = (now) => {
                rafRef.current = requestAnimationFrame(draw);

                // ~24fps is plenty and keeps the main thread free.
                if (now - lastFrameRef.current < 42) return;
                lastFrameRef.current = now;

                const { cols: c, ramp: r, invert: inv } = settings.current;
                const chars = RAMPS[r];
                const aspect = (video.videoHeight || 3) / (video.videoWidth || 4);
                // Characters are about twice as tall as they are wide.
                const rows = Math.max(8, Math.round(c * aspect * 0.5));

                canvas.width = c;
                canvas.height = rows;

                // Mirror, so it behaves like a mirror rather than a photo.
                ctx.save();
                ctx.translate(c, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, c, rows);
                ctx.restore();

                const { data } = ctx.getImageData(0, 0, c, rows);
                const last = chars.length - 1;
                let out = "";

                for (let y = 0; y < rows; y += 1) {
                    for (let x = 0; x < c; x += 1) {
                        const i = (y * c + x) * 4;
                        // Rec. 601 luma — closer to perceived brightness than a plain average.
                        const luma =
                            (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
                        const level = inv ? 1 - luma : luma;
                        out += chars[Math.min(last, Math.max(0, Math.round(level * last)))];
                    }
                    out += "\n";
                }

                if (outputRef.current) outputRef.current.textContent = out;
            };

            rafRef.current = requestAnimationFrame(draw);
        } catch (error) {
            setState(error?.name === "NotAllowedError" ? DENIED : UNSUPPORTED);
        }
    }, []);

    const copy = async () => {
        const text = outputRef.current?.textContent;
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            /* clipboard blocked — nothing useful to do */
        }
    };

    return (
        <div className={styles.wrap}>
            <video ref={videoRef} className={styles.hidden} playsInline muted />
            <canvas ref={canvasRef} className={styles.hidden} />

            <div className={styles.screen}>
                {state === LIVE ? (
                    <pre ref={outputRef} className={styles.art} aria-label="Live ASCII camera" />
                ) : (
                    <div className={styles.placeholder}>
                        <p className={styles.placeholderTitle}>
                            {state === DENIED
                                ? "Camera permission was blocked."
                                : state === UNSUPPORTED
                                  ? "No camera available in this browser."
                                  : "Your face, as text."}
                        </p>
                        <p className={styles.placeholderBody}>
                            {state === DENIED
                                ? "Allow camera access in your browser's site settings and try again."
                                : state === UNSUPPORTED
                                  ? "This needs a camera and a secure connection."
                                  : "Every frame gets shrunk to a grid, and each cell swapped for the character closest to its brightness. That is the entire trick."}
                        </p>

                        {state !== UNSUPPORTED && (
                            <button
                                type="button"
                                className={styles.start}
                                onClick={start}
                                disabled={state === ASKING}
                            >
                                {state === ASKING ? "waiting for permission…" : "turn on camera"}
                            </button>
                        )}

                        <p className={styles.privacy}>
                            Runs entirely in this tab. No frame is uploaded, stored or sent
                            anywhere — turn it off and it is gone.
                        </p>
                    </div>
                )}
            </div>

            <div className={styles.controls}>
                <div className={styles.ramps}>
                    {RAMP_ORDER.map((key) => (
                        <button
                            key={key}
                            type="button"
                            className={`${styles.chip} ${ramp === key ? styles.chipOn : ""}`}
                            onClick={() => setRamp(key)}
                        >
                            {key}
                        </button>
                    ))}
                </div>

                <label className={styles.slider}>
                    detail
                    <input
                        type="range"
                        min="40"
                        max="150"
                        value={cols}
                        onChange={(e) => setCols(Number(e.target.value))}
                    />
                </label>

                <button
                    type="button"
                    className={`${styles.chip} ${invert ? styles.chipOn : ""}`}
                    onClick={() => setInvert((v) => !v)}
                >
                    invert
                </button>

                {state === LIVE && (
                    <div className={styles.right}>
                        <button type="button" className={styles.chip} onClick={copy}>
                            {copied ? "copied ✓" : "copy as text"}
                        </button>
                        <button type="button" className={styles.stop} onClick={stop}>
                            stop
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
