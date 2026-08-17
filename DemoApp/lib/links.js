/**
 * Where each session lives.
 *
 * Backend URLs are deliberately absent from this file. They are read from
 * server-only environment variables inside app/backend/page.jsx so nothing
 * is hardcoded in a public repo:
 *
 *   BACKEND_URL       the deployed Django app; when set, /backend redirects
 *                     to it and the value never reaches the browser
 *   BACKEND_REPO_URL  the source repo, rendered as a link on /backend
 *
 * The main page only ever points at the local /backend route.
 */
export const FRONTEND_URL = "/frontend";
export const BACKEND_URL = "/backend";

export const isExternal = (href) => /^https?:\/\//.test(href);
