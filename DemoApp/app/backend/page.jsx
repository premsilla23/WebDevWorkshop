import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

/* Read the env var per request so flipping it on Vercel takes effect without
   a rebuild. */
export const dynamic = "force-dynamic";

export const metadata = {
    title: "Backend Basics",
    description: "The Django session of the WebDev vertical.",
};

const STEPS = [
    ["git clone", "grab the project onto your machine"],
    ["python -m venv .venv && source .venv/bin/activate", "isolate the dependencies"],
    ["pip install -r requirements.txt", "Django 6.1 and friends"],
    ["python manage.py migrate", "build the SQLite schema"],
    ["python manage.py seed_data", "load sample artists, albums and songs"],
    ["python manage.py runserver", "open http://127.0.0.1:8000"],
];

const COVERED = [
    ["Models & the ORM", "Artist, Album, Song, Playlist, RecentlyPlayed — and the migrations that build them."],
    ["Views & routing", "Function views and class-based views wired up in urls.py."],
    ["Auth", "Signup, login, password change and the full password-reset flow."],
    ["Templates", "Template inheritance from base.html, plus static files."],
];

export default function Backend() {
    /* Set BACKEND_URL and this route becomes a redirect to the live app.
       Read server-side, so the host never appears in the shipped HTML. */
    const deployed = process.env.BACKEND_URL;
    if (deployed) redirect(deployed);

    const repo = process.env.BACKEND_REPO_URL;

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <Link href="/" className={styles.back}>
                    <span aria-hidden="true">←</span> back
                </Link>

                <span className={styles.status}>server up · app not deployed yet</span>

                <h1 className={styles.title}>
                    Backend Basics
                    <span className={styles.titleAccent}>a Django music app</span>
                </h1>

                <p className={styles.lede}>
                    Artists, albums, playlists, likes and a full auth flow — the whole
                    request → view → model → template path in one codebase. The host is
                    provisioned but the app is not serving yet, so run it locally for now.
                </p>

                {repo && (
                    <div className={styles.actions}>
                        <a
                            className={styles.primary}
                            href={repo}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className={styles.prompt}>~$</span>
                            view the source
                            <span className={styles.arrow}>↗</span>
                        </a>
                    </div>
                )}

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>Run it locally</h2>
                    <ol className={styles.steps}>
                        {STEPS.map(([cmd, note]) => (
                            <li key={cmd}>
                                <code>{cmd}</code>
                                <span>{note}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>What it covers</h2>
                    <dl className={styles.covered}>
                        {COVERED.map(([term, desc]) => (
                            <div key={term}>
                                <dt>{term}</dt>
                                <dd>{desc}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>
        </main>
    );
}
