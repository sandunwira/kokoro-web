# kokoro-web

A free, browser-only text-to-speech web app powered by [Kokoro-82M](https://github.com/hexgrad/kokoro) via [`kokoro-js`](https://www.npmjs.com/package/kokoro-js). No API keys, no server, no per-character charges, inference runs locally in the browser with ONNX Runtime (WASM).

## Features

- **100% local generation**: audio never leaves the visitor's device
- **On-demand model download**: the page loads instantly; the ~92 MB quantized (`q8`) model only downloads when you press **Download model**, then the browser caches it for later visits
- **28 voices**: American/British English, male and female, with friendly names
- **Speed control**: 0.7x to 1.4x
- **Regeneration**: old audio is discarded automatically when generating a new clip
- **Clear button**: manually remove the current audio
- **Generating state**: spinner placeholder while audio is being produced
- **Download WAV**: save the result as a `.wav` file
- **Light/dark theme**: follows the system preference
- **Responsive**: works on phones and desktops

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL, click **Download model**, wait for the first download, then hit **Generate speech**.

## Build

```bash
npm run build
npm run lint
```

The output is static files in `dist/`.

## Deploy

Because everything runs client-side, any static host works:

- **Cloudflare Pages** (recommended)
- **GitHub Pages**
- **Netlify** / **Vercel**

No backend, database, or secrets are required.

## How it works

1. `KokoroTTS.from_pretrained()` fetches the ONNX model from the Hugging Face Hub (with progress reporting) on first button click.
2. Text is phonemized and synthesized entirely in the browser via ONNX Runtime WASM.
3. The resulting audio is wrapped in a `Blob` → object URL for playback and download.

## Notes

- First model download takes a while on slow connections; progress is shown as a percentage.
- Long texts should be chunked (sentence splitting) for production use, the UI caps input at 1,500 characters.
- English-first: other languages depend on the model's phonemizer coverage.
- The Kokoro model weights are licensed under **Apache-2.0**.

## Stack

- [React 19](https://react.dev) + [Vite](https://vite.dev)
- [kokoro-js](https://www.npmjs.com/package/kokoro-js) + ONNX Runtime Web
- [Oxlint](https://oxc.rs) for linting
