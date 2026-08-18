"use client";

import { usePathname } from "next/navigation";
import styles from "./RouteTransition.module.css";

/**
 * Replays an entry animation whenever the route changes.
 *
 * React's <ViewTransition> is documented for the App Router but is not
 * exported by the React build this project resolves (19.2.8), so this does the
 * same job with a keyed remount and plain CSS — which also means it degrades
 * gracefully rather than depending on View Transitions API support.
 */
export default function RouteTransition({ children }) {
    const pathname = usePathname();

    return (
        <div key={pathname} className={styles.frame}>
            <span className={styles.sweep} aria-hidden="true" />
            {children}
        </div>
    );
}
