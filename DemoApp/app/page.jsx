import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
    return (
        <main className={styles.main}>
            <h1>Workshop for WebDev</h1>
            <div className={styles.buttonRow}>
                <Link href="/frontend">
                    <button className={styles.button}>Frontend Basics</button>
                </Link>
                <Link href="/backend">
                    <button className={styles.button}>Backend Basics</button>
                </Link>
            </div>
        </main>
    );
}