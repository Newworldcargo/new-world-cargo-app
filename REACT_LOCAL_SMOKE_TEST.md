# React Local Smoke Test

Date: 2026-08-23

The repository cloned successfully from `https://github.com/georgemunganga/new-world-cargo-app.git` at commit `cec15cf` on branch `main`.

Dependencies installed with `pnpm install --frozen-lockfile`.

Validation results:

- `pnpm check`: passed with exit code 0.
- `pnpm test`: passed, 21 test files and 68 tests.
- `pnpm build`: produced `dist/public/index.html` and `dist/index.js`; Vite reported `built in 3.34s`.

Browser smoke test:

- Local Vite server started at `http://localhost:3000/`.
- Root navigation redirected to `/login?returnTo=%2F`.
- Login UI rendered successfully with email/phone, password, sign-in, Google, account registration, terms, and privacy controls.
- The app defaults to mock mode because `VITE_NWC_DATA_MODE` is unset; live HTTP mode was not tested against Laravel because the Laravel branch lacks a bootable local vendor installation and no staging origin was provided.

Build warnings observed:

- `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` are not defined.
- The analytics script placeholder in `index.html` lacks a `type="module"` attribute.
- pnpm warned that the `pnpm` field in `package.json` is no longer read by the installed pnpm version, so patched dependency/override settings may not be applied as intended.
