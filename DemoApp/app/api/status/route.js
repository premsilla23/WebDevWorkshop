import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 6000;

/**
 * Probes are run server-side for two reasons: the browser cannot measure
 * cross-origin latency without CORS, and the backend host lives in a
 * server-only env var that must not reach the client. Only the measurement
 * is returned — never the URL.
 */
function targets() {
    const list = [];

    const site =
        process.env.CANONICAL_HOST ??
        process.env.VERCEL_PROJECT_PRODUCTION_URL ??
        process.env.VERCEL_URL;

    if (site) {
        list.push({
            id: "web",
            name: "Web",
            detail: "Next.js on Vercel",
            url: site.startsWith("http") ? site : `https://${site}`,
        });
    }

    if (process.env.BACKEND_URL) {
        list.push({
            id: "api",
            name: "Django",
            detail: "Gunicorn on a droplet",
            url: process.env.BACKEND_URL,
        });
    }

    return list;
}

async function probe(target) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startedAt = performance.now();

    try {
        const response = await fetch(target.url, {
            method: "GET",
            redirect: "follow",
            cache: "no-store",
            signal: controller.signal,
            headers: { "user-agent": "codingclub-status/1.0" },
        });
        return {
            id: target.id,
            name: target.name,
            detail: target.detail,
            ok: response.ok,
            status: response.status,
            ms: Math.round(performance.now() - startedAt),
        };
    } catch (error) {
        return {
            id: target.id,
            name: target.name,
            detail: target.detail,
            ok: false,
            status: error.name === "AbortError" ? 504 : 0,
            ms: Math.round(performance.now() - startedAt),
        };
    } finally {
        clearTimeout(timer);
    }
}

export async function GET() {
    const services = await Promise.all(targets().map(probe));

    return NextResponse.json(
        {
            checkedAt: Date.now(),
            services,
            build: {
                commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7),
                branch: process.env.VERCEL_GIT_COMMIT_REF ?? "dev",
                region: process.env.VERCEL_REGION ?? "local",
                env: process.env.VERCEL_ENV ?? "development",
            },
        },
        { headers: { "cache-control": "no-store" } }
    );
}
