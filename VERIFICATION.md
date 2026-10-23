# V1 verification record

This file records the initial cloud workspace checks, not a claim of production deployment.

## Passed

- Node.js 24 build completed; 1 published game discovered automatically.
- 11 Node tests passed: all 20 puzzle seeds solvable, rational arithmetic (including 8 / (3 - 8 / 3) = 24), invalid divisions, registry discovery, published filtering, entry validation, path and symlink safety.
- Frontend and Playwright test JavaScript syntax checks passed.
- Playwright discovers 12 cases across desktop Chromium, Android Chromium, and iPhone WebKit profiles. The desktop touch-only case is intentionally skipped.
- Generated `dist/` contains only the lobby, game catalog, one game's assets, 404 page and HTTP headers. No credential or dependency files are included.

## Not yet verified

- Browser test execution is blocked in the initial cloud environment by browser process sandbox/system-library limitations. These are environment errors, not passing assertions. GitHub Actions installs the supported dependencies and runs the browser suite; its actual result must be checked.
- Visual screenshots and real iPhone Safari operation have not been verified.
- GitHub repository creation, Cloudflare project creation, credentials, public HTTPS and automatic redeployment require separate authorized execution and verification.

Run `npm run check`, install Playwright's Chromium/WebKit with system dependencies, then `npm run test:e2e` on a supported runner. For the live site use `BASE_URL=https://ACTUAL-PRODUCTION-URL npm run test:e2e`. Record the exact commit SHA and deployment URL after successful publication.
