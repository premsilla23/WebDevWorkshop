import Link from "next/link";
import PathfindingLab from "@/components/lab/PathfindingLab";
import ShaderLab from "@/components/lab/ShaderLab";
import SystemsBoard from "@/components/lab/SystemsBoard";
import styles from "./page.module.css";

export const metadata = {
    title: "The lab",
    description:
        "Live systems, algorithm visualisations and realtime graphics, running in your browser. The engineering side of Coding Club, BITS Pilani.",
};

export default function Home() {
    return (
        <div className={styles.page}>
            {/* ------------------------------ top bar ------------------------------ */}
            <div className={styles.bar}>
                <div className={styles.barInner}>
                    <Link href="/" className={styles.mark}>
                        ← Coding Club · BITS Pilani
                    </Link>
                    <nav className={styles.barNav}>
                        <a href="#pathfinding">pathfinding</a>
                        <a href="#systems">systems</a>
                        <a href="#shader">shader</a>
                    </nav>
                    <Link href="/club" className={styles.enter}>
                        workshop <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>

            <main>
                {/* ------------------------------- hero ------------------------------- */}
                <section className={styles.shell}>
                    <div className={styles.hero}>
                        <p className={styles.eyebrow}>
                            <span className={styles.eyebrowDot} aria-hidden="true" />
                            everything on this page is running, not rendered
                        </p>

                        <h1 className={styles.title}>
                            Three ways to find a path.
                            <span className={styles.titleAccent}>One of them is smart.</span>
                        </h1>

                        <p className={styles.lede}>
                            The same grid, the same start and goal, three search algorithms
                            racing side by side. Watch how much of it each one has to search
                            before finding the answer — then draw your own walls and make it
                            harder.
                        </p>
                    </div>

                    <div id="pathfinding">
                        <PathfindingLab />
                    </div>
                </section>

                {/* ------------------------------ systems ----------------------------- */}
                <section id="systems" className={styles.section}>
                    <div className={styles.shell}>
                        <header className={styles.sectionHead}>
                            <div>
                                <span className={styles.label}>01 / systems</span>
                                <h2 className={styles.sectionTitle}>
                                    Our own infrastructure, checked live.
                                </h2>
                            </div>
                            <p className={styles.sectionNote}>
                                Both services are probed from the server rendering this page. The
                                numbers below were measured seconds ago — including the ones that
                                make us look bad.
                            </p>
                        </header>

                        <SystemsBoard />
                    </div>
                </section>

                {/* ------------------------------ shader ------------------------------ */}
                <section id="shader" className={styles.section}>
                    <div className={styles.shell}>
                        <header className={styles.sectionHead}>
                            <div>
                                <span className={styles.label}>02 / graphics</span>
                                <h2 className={styles.sectionTitle}>
                                    A fragment shader you can break.
                                </h2>
                            </div>
                            <p className={styles.sectionNote}>
                                Domain-warped fractal noise, evaluated per pixel per frame on the
                                GPU. Edit the GLSL and it recompiles — mistakes included, with the
                                driver&apos;s real error message.
                            </p>
                        </header>

                        <ShaderLab />
                    </div>
                </section>

                {/* -------------------------------- cta ------------------------------- */}
                <section className={styles.cta}>
                    <div className={styles.shell}>
                        <div className={styles.ctaInner}>
                            <div>
                                <h2 className={styles.ctaTitle}>
                                    We teach this, badly at first, until it clicks.
                                </h2>
                                <p className={styles.ctaNote}>
                                    The workshop is where the above starts — hands-on sessions on
                                    frontend and backend, with a terminal and a live editor you can
                                    poke at right now.
                                </p>
                            </div>

                            <Link href="/club" className={styles.ctaButton}>
                                <span className={styles.prompt}>~$</span>
                                cd workshop
                                <span className={styles.arrow}>↵</span>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className={styles.shell}>
                <div className={styles.footer}>
                    <span>Coding Club, BITS Pilani — WebDev Vertical</span>
                    <Link href="/club">workshop →</Link>
                </div>
            </footer>
        </div>
    );
}
