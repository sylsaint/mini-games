# V1 verification record

This file records cloud workspace checks and the first GitHub Actions test run, not a claim of production deployment.

## Passed

- Node.js 24 build completed; 1 published game discovered automatically.
- 11 Node tests passed: all 20 puzzle seeds solvable, rational arithmetic (including 8 / (3 - 8 / 3) = 24), invalid divisions, registry discovery, published filtering, entry validation, path and symlink safety.
- Frontend and Playwright test JavaScript syntax checks passed.
- GitHub Actions browser testing passed on the initial main commit `2987c69e46410077d127e2e57e2810111d623b31`: desktop Chromium, Android Chromium, and iPhone WebKit profiles, including mobile touch. The desktop touch-only case is intentionally skipped. Source: https://github.com/sylsaint/mini-games/actions/runs/39887413291
- Three additional screenshot capture cases (one per browser profile) are prepared for the next CI run; their screenshots are not yet visually verified.
- Generated `dist/` contains only the lobby, game catalog, one game's assets, 404 page and HTTP headers. No credential or dependency files are included.

## Not yet verified

- Local browser launch remains blocked by cloud sandbox/system-library limitations; this local limitation was resolved for functional verification by running on GitHub-hosted Linux. It does not establish actual iPhone hardware compatibility.
- Visual screenshots and real iPhone Safari operation have not been verified.
- Public source repository exists at https://github.com/sylsaint/mini-games/tree/main. The first CD run completed browser tests but stopped at the missing Cloudflare secrets check; no deployment was claimed. Cloudflare credentials/project, public HTTPS and automatic redeployment remain pending.

Run `npm run check`, install Playwright's Chromium/WebKit with system dependencies, then `npm run test:e2e` on a supported runner. For the live site use `BASE_URL=https://ACTUAL-PRODUCTION-URL npm run test:e2e`. Record the exact commit SHA and deployment URL after successful publication.
