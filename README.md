# Vision

Vision is a **Chrome extension** (Plasmo, Manifest V3) that runs an AI browser agent in the extension: chat in the side panel, tools for tabs and page interaction, optional voice, memory, and RAG (Supabase). Requests go to **Ollama Cloud** from the extension; there is no separate Node backend.

## Requirements

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) (recommended; npm works if you adjust commands)

## Quick start

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. **Ollama Cloud API key** (required for the model):

   - Copy `.env.example` to `.env` and set `PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN`, **or**
   - Paste the key in the extension **Settings** after loading the build (keys in Settings are not committed).

   Plasmo inlines only variables prefixed with `PLASMO_PUBLIC_` into the dev bundle.

3. Run the dev build:

   ```bash
   pnpm dev
   ```

4. In Chrome, open **Extensions → Developer mode → Load unpacked** and select the dev output folder (e.g. `build/chrome-mv3-dev`).

5. Click the Vision toolbar icon to open the **side panel** (primary UI).

## Scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `pnpm dev`     | Plasmo dev server + HMR        |
| `pnpm build`   | Production extension bundle    |
| `pnpm package` | Zip for store submission       |
| `pnpm typecheck` | `tsc --noEmit`               |
| `pnpm format`  | Prettier on `src/**`           |

## Optional: Supabase (RAG)

If you use RAG indexing/search, configure Supabase URL and anon key in **Settings** (see `supabase/migration.sql` for schema). The app works without Supabase for core chat and browser tools.

## Project layout (short)

| Path | Role |
| ---- | ---- |
| `src/sidepanel/` | React UI (chat, settings, voice) |
| `src/background/` | Service worker, AI `streamText` port, messaging |
| `src/contents/` | Content scripts (page context, interaction) |
| `src/tools/` | Tool definitions the model can call |
| `CLAUDE.md` | Product and engineering conventions for contributors |

## Agent loop limits

Tool-using runs use the Vercel AI SDK `stopWhen: stepCountIs(...)` so each reply has a finite cap on model/tool rounds. The limit is set in `src/background/ports/stream.ts` (`AGENT_MAX_STEPS`). If very long automations hit the cap, increase that constant or split the task across messages.

## Security note

Do not commit `.env` or real API keys. Use `.env.example` as a template only.

## License

See `package.json` / repository for license information.
