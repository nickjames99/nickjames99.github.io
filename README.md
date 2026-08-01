# Isle Skin Code Editor — protected GitHub Pages build

This project wraps the existing editor in a Vite production build and applies
conservative JavaScript obfuscation after bundling.

## What this improves

- Bundles the application into hashed production assets.
- Minifies HTML, CSS, and JavaScript.
- Removes source maps.
- Obfuscates production JavaScript.
- Encodes most strings and identifiers.
- Splits embedded assets out of the main bundle when Vite can do so.
- Deploys only `dist/` through GitHub Actions.
- Keeps the readable source out of the deployed Pages artifact.

This raises the difficulty of copying the implementation, but a browser app
cannot be made impossible to inspect or reverse engineer.

## One-time GitHub setup

1. Create or open the GitHub repository.
2. Upload all files from this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push to the `main` branch.
6. Open the repository's **Actions** tab and wait for the deployment to finish.

For a project site such as:

`https://USERNAME.github.io/REPOSITORY/`

the Vite base path is detected automatically.

For a user site named `USERNAME.github.io`, or a custom domain, the base path
defaults to `/`.

## Local testing

Install Node.js 22 or newer, then run:

```bash
npm install
npm run dev
```

Production test:

```bash
npm run build
npm run preview
```

The protected site is generated in `dist/`.

## Important publishing rule

Do not manually publish the source files from the repository branch.

Use the included GitHub Actions workflow. GitHub Pages will receive only the
generated `dist/` artifact.

## Why aggressive obfuscator options are disabled

`controlFlowFlattening`, `deadCodeInjection`, `debugProtection`, and
`selfDefending` are intentionally disabled. Those options can heavily increase
file size, reduce performance, and sometimes break browser applications.

The included settings provide a better balance between protection and keeping
the editor functional.

## Optional: make the repository private

GitHub Pages availability for private repositories depends on the GitHub plan.
Even with a private source repository, the deployed browser assets remain
downloadable by site visitors.

## WebAssembly note

Moving the encoder and decoder into WebAssembly can make casual inspection
harder, but WebAssembly is still downloaded to the visitor's browser and can be
reverse engineered. It is best treated as an extra obstacle, not real secrecy.

Because the current editor is tightly integrated into one large script, the
reliable first step is this Vite + obfuscation build. Move only the stable,
well-tested encoder/decoder functions into WebAssembly later.
