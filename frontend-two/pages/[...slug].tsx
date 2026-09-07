/* Catch-all for routes that have no matching page. Without this, the Next.js
client router falls through to pages/index.tsx for unknown URLs, which
unconditionally redirects to /dashboard
Direct hits on unknown URLs are handled by CloudFront serving 404.html. */
export { default } from "./404";
