# Mini Games

A small, maintainable static game platform. One repository, one Cloudflare Pages Direct Upload project, no backend and no dependence on an owner's computer staying online.

Production: https://mini-games-a3y.pages.dev

Source: https://github.com/sylsaint/mini-games

Initial Pages creation and deployment were confirmed by GitHub Actions run [39891793211](https://github.com/sylsaint/mini-games/actions/runs/39891793211), commit `405fc80735058de18f37f7c97ee226456b2cc74f`. The CD workflow now checks the deployed revision and runs public-site browser interactions after every deploy.

## Requirements and local checks

Node.js 24, npm. Runtime has **zero third-party dependencies**. Wrangler and Playwright are pinned development tools; commit `package-lock.json`.

```sh
npm ci
npm run check
npx playwright install --with-deps chromium webkit
npm run test:e2e
npm run serve
```

Open http://127.0.0.1:4173. `dist/` is generated, intentionally ignored by Git. Never edit it directly. Tests validate the original HTML checksum and every embedded reference solution, metadata/entry validation, path traversal/symlink rejection, portal navigation, game success/failure, undo/restart, division by zero, sound activation, touch/drag interaction, and timer modes/pause/timeout behavior. Browser projects: desktop Chromium, Android Chromium profile, iPhone WebKit profile. Emulation is **not a real iPhone Safari device test**.

## Original 24-point game

The platform reuses the original `24点数字探险家.html` version 3, rather than a rewritten demo. Its 164,499 bytes are preserved exactly in `games/twenty-four/index.html`:

SHA-256: `8251778d3900e59886ceae173a4d30e157fef336150256177c6a35739d1bbc86`

The game contains 50 levels, 500 distinct puzzles and 1,658 embedded reference solutions. It offers tap/drag merging, 10/30/60-second modes, Web Audio sound effects, explanations and local progress saving. Sound starts after a user gesture; synthesized audio activation tests do not verify audible output on a physical iPhone. No external resources or network endpoints were found in this original file. The original has no platform back-link added; use the browser Back button to return to the lobby.

Prettier excludes the imported HTML. `game.json` pins `sourceSha256`; the build refuses accidental changes, writes each game's `entrySha256` to the manifest, and public HTTP verification checks the deployed bytes against that hash. Any future intentional edit to the original requires a reviewed checksum update, not silent reformatting.

## Structure

- `portal/`: static game lobby, styling, card rendering.
- `games/<id>/`: self-contained game resources and `game.json`.
- `scripts/`: Node-only metadata validator, build and local server.
- `tests/`: Node unit/integration and Playwright browser tests.
- `.github/workflows/ci.yml`: checks and builds pull requests, no deployment secrets.
- `.github/workflows/cd.yml`: main-only production deployment after the same tests.
- `dist/`: generated public static website.

## Add a game without editing the lobby

1. Create `games/my-game/` and add HTML, JS/CSS/images. Prefer relative asset URLs so the game works at `/games/my-game/`.
2. Add `game.json` (UTF-8):

```json
{
  "id": "my-game",
  "name": "我的小游戏",
  "description": "一句话介绍",
  "entry": "index.html",
  "cover": "cover.svg",
  "published": true,
  "tags": ["益智"],
  "order": 2
}
```

3. `id` must match its directory, using lowercase letters/numbers/hyphens. Entry and cover are paths within that directory. Set `published: false` for drafts (excluded from catalog and deployment).
4. Run `npm run check`, add browser tests as appropriate, open a PR, merge to `main` after checks.

The build discovers published directories, validates metadata and files, copies resources to `dist/games/<id>/`, and generates `dist/games.json`. The lobby reads this manifest automatically. All files in a published game directory become **public**; keep source secrets/private data elsewhere. Hidden files, symlinks and dependency directories are rejected. Pure HTML games do not need a bundler or framework. Use same-origin assets; no analytics, fonts or third-party trackers are included.

## Cloudflare / GitHub setup (requires owner authorization)

Do not put tokens in source, chat, command arguments, or `.env` committed to Git. Create only a **new** repository/project; inspect for an existing `mini-games` first, and stop rather than overwriting it.

1. Create GitHub repository `mini-games` on the intended owner account. The owner has explicitly authorized this new repository to be public. Push this source with `main` as default branch.
2. Authenticate Wrangler through the official browser/device OAuth flow. Inspect account and existing Pages projects: `npx wrangler whoami` and `npx wrangler pages project list`.
3. If `mini-games` does not exist, create a Direct Upload project: `npx wrangler pages project create mini-games --production-branch main`. Do not select Cloudflare Git integration: GitHub Actions owns deployment.
4. Owner creates a Cloudflare API token scoped to the chosen account with `Account → Cloudflare Pages → Edit`. Limit account resources to that account. Credential creation and persistent CI access require explicit owner approval.
5. In GitHub repository Settings → Secrets and variables → Actions, securely add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Never print the token. The account ID can be found in Cloudflare's dashboard / Wrangler account information.
6. Push to `main` or manually run CD. CD validates secrets, tests and builds, then runs `wrangler pages deploy dist --project-name mini-games --branch main --commit-hash "$GITHUB_SHA"`.
7. Obtain the **actual** production HTTPS URL from Cloudflare/Wrangler; do not assume name availability. Check the portal, game and assets. Make a second small commit and verify CD is triggered for its exact SHA and Cloudflare serves the update.

Do not use `pull_request_target` to run untrusted PR source with secrets. Workflow permissions are `contents: read`, checkout does not persist credentials, and deployments are serialized. Cloudflare token exists only in credential/deploy steps. No payment or custom domain required for the static V1 implementation; account entitlements and any charges must be confirmed by the owner.

## One-time safe project bootstrap

The normal CD workflow does not create projects. `scripts/bootstrap-pages.mjs` is a separately invoked create-only tool, not part of regular deployment. It looks up exactly `mini-games` in the account named by the repository secret and makes one create request only after HTTP 404 with Cloudflare's explicit `8000007` project-not-found error. It refuses existing projects, unknown errors, authorization failures and ambiguous responses.

Do not run the bootstrap on an existing project. If a creation outcome is uncertain, inspect Cloudflare first; never rerun blindly. Removing the temporary bootstrap step is appropriate only after initial creation has been confirmed. Source cleanup by itself is not evidence that a project exists.

The build also creates public `build.json` containing only `sourceCommit` (a validated 40-character Git commit SHA or `local`) and `builtAt` (an ISO timestamp), to verify the exact deployed revision. No account IDs or credentials are included.

API references: [get project](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/), [create project](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/create/). The not-found code is confirmed in [Cloudflare's Wrangler source](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/pages/deploy.ts).

## Verify the public deployment

After obtaining the actual production Pages origin, run:

```sh
BASE_URL=https://mini-games-a3y.pages.dev EXPECTED_COMMIT=FULL_COMMIT_SHA node scripts/verify-live.mjs
```

This read-only check verifies the exact public build revision, lobby, catalog, all registered games, their covers, scripts, styles and local static module imports. It waits up to two minutes for propagation and fails clearly if the expected revision/resources do not appear. It never uses Cloudflare credentials. This HTTP check supplements Playwright interaction tests; it does not replace them or real iPhone Safari testing. The production URL above was verified from the successful initial deployment; replace FULL_COMMIT_SHA with the exact deployed commit.

## Deployment verification checklist

- [ ] New GitHub repository URL verified; no existing repository overwritten.
- [ ] Cloudflare account and Pages project created/verified by authorized owner.
- [ ] Secrets securely configured; no token present in Git history or build output.
- [ ] CD succeeds for the pushed commit SHA.
- [ ] Public HTTPS lobby, manifest, images and game respond successfully.
- [ ] Playwright remote smoke: `BASE_URL=https://ACTUAL-PRODUCTION-URL npm run test:e2e`.
- [ ] Real iPhone Safari interaction tested by the owner/tester (not equivalent to WebKit emulation).
- [ ] Subsequent main commit triggers successful automatic redeployment.
- [ ] Hosting remains available independently of any developer Mac/cloud editing session.

Checklist items are not marked done by source generation. Authentication, repository creation, deployment, real device checks and later CI status must be verified separately.

## Maintenance

Review dependency updates in a PR and rerun all checks. Keep Node 24's supported patch level updated. To add new game capabilities, avoid introducing a shared framework until needed. Cloudflare stores the deployed static artifacts; stopping the build/editing computer does not stop hosting. The platform has no account registration or remote data collection. The original game stores progress, sound preference and unfinished timed rounds in the current browser's localStorage. It does not sync across devices; clearing browser data removes that progress.

Official references:

- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions
