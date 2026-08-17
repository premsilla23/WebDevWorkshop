import Link from "next/link";
import AsciiCam from "@/components/live/AsciiCam";
import EditableHero from "@/components/live/EditableHero";
import styles from "./page.module.css";

export const metadata = {
    title: "Coding Club BITS Pilani — WebDev Vertical",
    description:
        "A website is just text you can change. Play with this page, then come build one with us.",
};

export default function Home() {
    return (
        <div className={styles.page}>
            {/* ------------------------------ top bar ------------------------------ */}
            <header className={styles.bar}>
                <div className={styles.barInner}>
                    <span className={styles.mark}>Coding Club · BITS Pilani</span>
                    <nav className={styles.barNav}>
                        <a href="#camera">camera</a>
                        <Link href="/lab">the lab</Link>
                    </nav>
                    <Link href="/club" className={styles.enter}>
                        workshop <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </header>

            <main>
                {/* ------------------------- editable hero ------------------------- */}
                <section className={styles.shell}>
                    <div className={styles.heroBlock}>
                        <EditableHero />
                    </div>
                </section>

                {/* ------------------------------ camera ---------------------------- */}
                <section id="camera" className={styles.section}>
                    <div className={styles.shell}>
                        <header className={styles.sectionHead}>
                            <div>
                                <span className={styles.label}>and one more thing</span>
                                <h2 className={styles.sectionTitle}>
                                    Turn yourself into text.
                                </h2>
                            </div>
                            <p className={styles.sectionNote}>
                                Roughly forty lines of code stand between a camera and this. Nothing
                                leaves your laptop — the whole thing runs in the tab you have open.
                            </p>
                        </header>

                        <AsciiCam />
                    </div>
                </section>

                {/* -------------------------------- cta ----------------------------- */}
                <section className={styles.cta}>
                    <div className={styles.shell}>
                        <div className={styles.ctaInner}>
                            <div>
                                <h2 className={styles.ctaTitle}>
                                    Nobody here started knowing any of this.
                                </h2>
                                <p className={styles.ctaNote}>
                                    We run hands-on sessions where you write the code in the room and
                                    fix it before you leave. No experience assumed — the first
                                    session starts at &ldquo;what is a tag&rdquo;.
                                </p>
                            </div>

                            <Link href="/club" className={styles.ctaButton}>
                                <span className={styles.prompt}>~$</span>
                                start learning
                                <span className={styles.arrow}>↵</span>
                            </Link>
                        </div>

                        <p className={styles.labLine}>
                            Already comfortable with code?{" "}
                            <Link href="/lab" className={styles.labLink}>
                                the lab →
                            </Link>{" "}
                            has pathfinding visualisers, live infrastructure probes and an editable
                            GPU shader.
                        </p>
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
