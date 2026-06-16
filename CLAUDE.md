# Obsidian IGDB Game Search Plugin

## Project Overview

TypeScript plugin for Obsidian that searches video games using the IGDB API and creates notes with game metadata.

- **Based on**: obsidian-book-search-plugin by anpigon
- **Entry point**: `main.ts` → compiled to `main.js`
- **Bundler**: esbuild
- **Package manager**: npm

## Development Commands

```bash
npm install           # Install dependencies
npm run dev           # Watch mode for development
npm run build         # Production build (runs tsc type check + esbuild)
npm run lint          # Run ESLint
npm run release:patch # Bump patch version and push tag
npm run release:minor # Bump minor version and push tag
npm run release:major # Bump major version and push tag
```

**Note**: This project does not currently have tests configured.

## Key Context

- Required release artifacts: `main.js`, `manifest.json`, `styles.css`
- For detailed development guidelines, see @AGENTS.md
- Keep `main.ts` minimal - delegate to separate modules
- Never commit `node_modules/` or `main.js`
- API requires Twitch/IGDB credentials (Client ID + Secret)

## Testing

Copy `main.js`, `manifest.json`, and `styles.css` to:

```
<Vault>/.obsidian/plugins/obsidian-igdb-game-search-plugin/
```
