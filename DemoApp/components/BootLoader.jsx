"use client";

import { useEffect, useState } from "react";
import CCLogo from "./CCLogo";
import styles from "./BootLoader.module.css";

/* Long enough for the mark to finish assembling (~1.5s) and hold a beat. */
const MIN_VISIBLE_MS = 2300;
const FADE_MS = 620;

/**
 * First-load intro. There is real work to wait on — the fonts this site loads —
 * so rather than a fake timer this waits for document.fonts.ready and holds a
 * minimum duration so the animation is not a flicker.
 *
 * Visibility is driven by a `data-booted` flag on <html> and plain CSS, not by
 * unmounting: the inline script in the layout sets that flag before first paint
 * on repeat views, so the overlay never renders a frame it shouldn't.
 */
export default function BootLoader() {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        const seen = sessionStorage.getItem("cc:booted") === "1";
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (seen || reduced) {
            root.dataset.booted = "true";
            return;
        }

        const startedAt = performance.now();
        let cancelled = false;
        let timer;

        const finish = () => {
            if (cancelled) return;
            const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));

            timer = setTimeout(() => {
                if (cancelled) return;
                setLeaving(true);
                sessionStorage.setItem("cc:booted", "1");
                // Let the fade play out before CSS takes the overlay away.
                timer = setTimeout(() => {
                    if (!cancelled) root.dataset.booted = "true";
                }, FADE_MS);
            }, wait);
        };

        const fonts = document.fonts?.ready ?? Promise.resolve();
        // Never hang on a slow font CDN.
        Promise.race([fonts, new Promise((r) => setTimeout(r, 3200))]).then(finish);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    return (
        <div
            data-boot-overlay=""
            className={`${styles.overlay} ${leaving ? styles.leaving : ""}`}
            role="status"
            aria-label="Loading"
        >
            <div className={styles.scene}>
                <CCLogo className={styles.logo} animated />
                <span className={styles.shadow} aria-hidden="true" />
            </div>

            <p className={styles.mark}>CODING CLUB</p>
            <p className={styles.sub}>BITS Pilani · WebDev</p>

            <span className={styles.track} aria-hidden="true">
                <span className={styles.fill} />
            </span>
        </div>
    );
}
