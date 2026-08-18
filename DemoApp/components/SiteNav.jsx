"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SiteNav.module.css";

/**
 * One nav for every page. The three destinations are always visible — even on
 * a phone — because a hamburger for three links is a tap nobody should have
 * to make.
 */
const ROUTES = [
    { href: "/", label: "home", full: "Home" },
    { href: "/lab", label: "lab", full: "The lab" },
    { href: "/club", label: "workshop", full: "Workshop" },
];

export default function SiteNav() {
    const pathname = usePathname();

    // /frontend and /backend hang off the workshop, so keep that tab lit.
    const activeIndex = (() => {
        if (pathname === "/") return 0;
        if (pathname.startsWith("/lab")) return 1;
        return 2;
    })();

    return (
        <header className={styles.bar}>
            <div className={styles.inner}>
                <Link href="/" className={styles.mark}>
                    <span className={styles.markShort}>CC</span>
                    <span className={styles.markFull}>Coding Club · BITS Pilani</span>
                </Link>

                <nav
                    className={styles.tabs}
                    style={{ "--active": activeIndex }}
                    aria-label="Sections"
                >
                    <span className={styles.indicator} aria-hidden="true" />
                    {ROUTES.map((route, i) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={`${styles.tab} ${i === activeIndex ? styles.tabOn : ""}`}
                            aria-current={i === activeIndex ? "page" : undefined}
                        >
                            {route.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
