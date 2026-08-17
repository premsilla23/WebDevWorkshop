import type { NextConfig } from "next";

/**
 * The hostname the site should be served from, e.g. "bits-coding-club.in".
 *
 * When set, every request that arrives on a *.vercel.app hostname is
 * redirected to the same path on this host, so the deployment URLs stop
 * serving the site and only the real domain does.
 *
 * Read at build time, so changing it on Vercel needs a redeploy.
 */
const canonicalHost = process.env.CANONICAL_HOST;

const nextConfig: NextConfig = {
    async redirects() {
        if (!canonicalHost) return [];

        return [
            {
                source: "/:path*",
                has: [{ type: "host", value: "(?<deployHost>.*\\.vercel\\.app)" }],
                destination: `https://${canonicalHost}/:path*`,
                // 307 rather than 308: browsers cache permanent redirects hard,
                // which is painful to undo if the domain ever changes.
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
