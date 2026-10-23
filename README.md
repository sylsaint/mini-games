# Mini Games

A small, maintainable static game platform. One repository, one Cloudflare Pages Direct Upload project, no backend and no dependence on an owner's computer staying online.

## Requirements and local checks

Node.js 24, npm. Runtime has **zero third-party dependencies**. Wrangler and Playwright are pinned development tools; commit `package-lock.json`.

```sh
npm ci
npm run check
npx playwright install --with-deps chromium webkit
npm run test:e2e
npm run serve
```

Open http://127.0.0.1:4173. `dist/` is generated, intentionally ignored by Git. Never edit it directly. Tests cover exact fractional arithmetic, every puzzle's solvability, metadata/entry validation, path traversal/symlink rejection, portal navigation, success/failure, undo/restart, division by zero and a fraction-only puzzle. Browser projects: desktop Chromium, Android Chromium profile, iPhone WebKit profile. Emulation is **not a real iPhone Safari device test**.

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

The temporary `Create new mini-games Pages project (one-time bootstrap)` CD step runs only after tests and credential checks. `scripts/bootstrap-pages.mjs` looks up exactly `mini-games` in the account named by the repository secret. It makes one create request only when the lookup returns HTTP 404 and Cloudflare's explicit `8000007` project-not-found error. It refuses existing projects, unknown errors, authorization failures and ambiguous responses. It does not deploy or modify projects.

After confirmed creation, remove that temporary workflow step before any future run. If creation times out or its response is uncertain, inspect the project in Cloudflare first; never rerun blindly. The script intentionally refuses to adopt a project on a rerun, even one created by a previous attempt. The normal deployment step continues to use Wrangler and must remain separate.

The build also creates public `build.json` containing only `sourceCommit` (a validated 40-character Git commit SHA or `local`) and `builtAt` (an ISO timestamp), to verify the exact deployed revision. No account IDs or credentials are included.

API references: [get project](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/), [create project](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/create/). The not-found code is confirmed in [Cloudflare's Wrangler source](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/pages/deploy.ts).

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

Review dependency updates in a PR and rerun all checks. Keep Node 24's supported patch level updated. To add new game capabilities, avoid introducing a shared framework until needed. Cloudflare stores the deployed static artifacts; stopping the build/editing computer does not stop hosting. Nothing in this app stores user data or requires login. The 24-point score is session-only and resets on page reload.

Official references:

- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions
