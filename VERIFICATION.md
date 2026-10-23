# V1 verification record

This file records actual cloud workspace checks and the initial production deployment. Later workflow outcomes must be verified for their own commit.

## Passed

- Node.js 24 build completed; 1 published game discovered automatically.
- 34 Node tests passed in the post-bootstrap cleanup patch, including bootstrap safety and public HTTP verification. The original game/build tests cover: all 20 puzzle seeds solvable, rational arithmetic (including 8 / (3 - 8 / 3) = 24), invalid divisions, registry discovery, published filtering, entry validation, path and symlink safety.
- Frontend and Playwright test JavaScript syntax checks passed.
- GitHub Actions browser testing passed on the initial main commit `2987c69e46410077d127e2e57e2810111d623b31`: desktop Chromium, Android Chromium, and iPhone WebKit profiles, including mobile touch. The desktop touch-only case is intentionally skipped. Source: https://github.com/sylsaint/mini-games/actions/runs/39887413291
- Three additional screenshot capture cases (one per browser profile) are prepared for the next CI run; their screenshots are not yet visually verified.
- Generated `dist/` contains only the lobby, game catalog, one game's assets, 404 page and HTTP headers. No credential or dependency files are included.

- Public source repository: https://github.com/sylsaint/mini-games/tree/main
- Initial project creation and Pages deployment succeeded in run https://github.com/sylsaint/mini-games/actions/runs/39891793211 for commit `405fc80735058de18f37f7c97ee226456b2cc74f`.
- Production origin https://mini-games-a3y.pages.dev was checked with `scripts/verify-live.mjs`: correct commit, one registered game and 10 public HTTP resources passed in one attempt. This is HTTP verification, not browser rendering/device verification.

## Not yet verified

- Local browser launch remains blocked by cloud sandbox/system-library limitations; this local limitation was resolved for functional verification by running on GitHub-hosted Linux. It does not establish actual iPhone hardware compatibility.
- Visual screenshots and real iPhone Safari operation have not been verified.
- Subsequent cleanup commit automatic redeployment and live browser interaction checks are pending; do not infer their success from the initial deployment.

Run `npm run check`, install Playwright's Chromium/WebKit with system dependencies, then `npm run test:e2e` on a supported runner. For the live site use `BASE_URL=https://mini-games-a3y.pages.dev npm run test:e2e`. Record the exact commit SHA and deployment URL after successful publication.
