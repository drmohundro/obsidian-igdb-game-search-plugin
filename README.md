# IGDB Game Search for Obsidian

An [Obsidian](https://obsidian.md) plugin that lets you search for video games using the [IGDB](https://www.igdb.com/) (Internet Game Database) API and create notes with game metadata.

## Credits and Alternatives

This plugin is flat out copied from [obsidian-book-search-plugin](https://github.com/anpigon/obsidian-book-search-plugin) by [anpigon](https://github.com/anpigon). The only difference is that this one uses the IGDB API and populates game notes instead.

If you're looking for alternatives, check out [obsidian-game-search-plugin](https://github.com/CMorooney/obsidian-game-search-plugin) by [CMorooney](https://github.com/CMorooney).

## Features

- Search for games using the IGDB database
- Create notes with game metadata (title, developer, publisher, release date, genres, platforms, etc.)
- Customizable note templates with variable substitution
- Cover image display in search results
- Optional automatic cover image download and local storage
- Customizable file naming and folder organization
- Integration with [Templater](https://github.com/SilentVoid13/Templater) plugin

## Requirements

This plugin requires IGDB API credentials from Twitch. The IGDB API is free to use.

### Getting API Credentials

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console)
2. Log in with your Twitch account (create one if needed)
3. Click "Register Your Application"
4. Fill in the application details:
   - Name: Any name (e.g., "Obsidian Game Search")
   - OAuth Redirect URLs: `http://localhost`
   - Category: Application Integration
5. Click "Create"
6. Click "Manage" on your new application
7. Copy the **Client ID**
8. Click "New Secret" to generate a **Client Secret** (save this securely)

## Installation

I haven't configured any releases or set this up yet, though I'm willing to. At the
moment, I set this up for myself.

## Usage

### Creating a Game Note

1. Click the gamepad icon in the left ribbon, or
2. Use the command palette (`Ctrl/Cmd + P`) and search for "Create new game note"
3. Enter a game title to search
4. Select a game from the search results
5. A new note will be created with the game metadata

### Inserting Metadata into Existing Notes

1. Open the note where you want to insert game metadata
2. Use the command palette and search for "Insert game metadata"
3. Search and select a game
4. The metadata will be inserted at the beginning of the note

## Settings

### General Settings

| Setting | Description |
|---------|-------------|
| New file location | Folder where new game notes will be created |
| New file name | Template for naming new files. Available variables: `{{name}}`, `{{developer}}`, `{{releaseYear}}`, `{{DATE}}` |
| Template file | Path to a template file for new game notes |

### IGDB API Settings

| Setting | Description |
|---------|-------------|
| Client ID | Your Twitch/IGDB Client ID |
| Client Secret | Your Twitch/IGDB Client Secret |
| Test Connection | Button to verify your API credentials |

### UI Settings

| Setting | Description |
|---------|-------------|
| Open new game note | Automatically open notes after creation |
| Show cover images in search | Display cover art in search results |

### Cover Image Settings

| Setting | Description |
|---------|-------------|
| Save cover images locally | Download and save cover images to your vault |
| Cover image path | Folder where cover images will be saved |

## Templates

You can create custom templates for your game notes. Templates support variable substitution using the `{{variableName}}` syntax.

### Available Template Variables

| Variable | Description |
|----------|-------------|
| `{{name}}` | Game title |
| `{{slug}}` | URL-friendly game name |
| `{{releaseDate}}` | Release date (YYYY-MM-DD format) |
| `{{releaseYear}}` | Release year |
| `{{developer}}` | Primary developer |
| `{{developers}}` | All developers (array) |
| `{{publisher}}` | Primary publisher |
| `{{publishers}}` | All publishers (array) |
| `{{genres}}` | Genres (array) |
| `{{genresFormatted}}` | Genres as formatted string |
| `{{gameModes}}` | Game modes (array) |
| `{{gameModesFormatted}}` | Game modes as formatted string |
| `{{platforms}}` | Platforms (array) |
| `{{platformsFormatted}}` | Platforms as formatted string |
| `{{coverUrl}}` | Cover image URL (thumbnail) |
| `{{coverSmallUrl}}` | Small cover image URL |
| `{{coverBigUrl}}` | Large cover image URL |
| `{{localCoverImage}}` | Path to locally saved cover image |
| `{{summary}}` | Game summary |
| `{{storyline}}` | Game storyline |
| `{{rating}}` | IGDB user rating (0-100) |
| `{{aggregatedRating}}` | Aggregated critic rating (0-100) |
| `{{url}}` | IGDB page URL |
| `{{websiteUrl}}` | Official game website URL |

### Date/Time Variables

| Variable | Description |
|----------|-------------|
| `{{date}}` | Current date (YYYY-MM-DD) |
| `{{date:format}}` | Current date with custom format |
| `{{date+1d}}` | Tomorrow |
| `{{date-1w}}` | One week ago |

### Inline Scripts

You can use inline JavaScript expressions with the `<%=expression%>` syntax:

```
Rating: <%=game.rating ? game.rating + '/100' : 'N/A'%>
```

### Example Template

```markdown
---
title: "{{name}}"
developer: "{{developer}}"
publisher: "{{publisher}}"
releaseDate: {{releaseDate}}
genres: {{genres}}
platforms: {{platforms}}
rating: {{rating}}
status: backlog
---

# {{name}}

![cover]({{coverBigUrl}})

## Summary

{{summary}}

## My Notes


```

## Development

```bash
# Clone the repository
git clone https://github.com/drmohundro/obsidian-igdb-game-search-plugin.git

# Install dependencies
npm install

# Build for development (watch mode)
npm run dev

# Build for production
npm run build
```

## License

MIT
