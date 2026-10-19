# PartBot's Structure

PartBot's layout can be broadly broken down into three 'core' modules and various 'helper' modules.

- PS
- Discord
- Web

and

- Globals
- Cache
- Database
- I18n (internationalization for translations)
- Secrets
- Sentinel
- Utils

---

## PS

The PS module has three parts - `commands`, `handlers`, and `loaders`.

### Commands

The `commands` directory stores all PS commands. A single file can export one or multiple commands, and each
command has configuration options. Folders can be used when a single source has too much complexity to be one
file (eg: games).

Commands may be either `.ts` or `.tsx` files - the `.tsx` extension is required to enable JSX syntax in the code.

Commands that output JSX must use one of the `*HTML` methods to work! `message.reply(JSX)` will not work; use
`message.replyHTML(JSX)` instead.

### Handlers

The `handlers` directory contains all PS event handlers as well as permissions management. Read the source code for
more details.

### Loaders

The `loaders` directory contains code to load data into cache (such as entries from a database, or command cache).
This lets the bot synchronize data such as alts and roomconfigs.

---

## Discord

The Discord module manages the bot's Discord integration using discord.js. Like PS, it has three main parts - `commands`, `handlers`, and `loaders`.

### Commands

The `commands` directory stores all Discord slash commands. Each command file exports a command with configuration including the slash command builder, handler function, and permissions.

### Handlers

The `handlers` directory contains event handlers for Discord events, primarily interaction handling (slash commands, buttons, etc.).

### Loaders

The `loaders` directory contains code to load Discord commands and set up channels. Commands are automatically registered with Discord's API on startup.

### Constants

The `constants` directory stores Discord-specific constants such as emotes and server-specific values like channel/guild/role IDs.

---

## Web

The Web module provides HTTP server functionality using Express.js. It serves static files, APIs, and UI components.

### Loaders

The `loaders` directory contains various loader modules that set up different aspects of the web server:

- `api.ts` - Loads API endpoints
- `bundles.ts` - Loads compiled React bundles
- `static.ts` - Serves static files (images, CSS)
- `ui.ts` - Loads UI routes
- `errors.ts` - Sets up error handling
- `middleware.ts` - Configures middleware
- `util.ts` - Utility functions for web loaders

### API

The `api` directory contains API endpoint handlers for various features like game data, GitHub webhooks, quotes, and the scrabble dictionary.

### UI

The `ui` directory contains server-side rendered UI components using JSX/TSX.

### Static

The `static` directory contains static assets like images for games (chess pieces, splendor cards, etc.).

---

## Globals

The Globals module sets up global augmentations and patches to enhance built-in types and functionality.

- `augment.ts` - Extends global types (eg: supporting stuff like psicon)
- `patches.ts` - Runtime patches for built-in objects (eg: patching console to remove React warnings)
- `prototypes.ts` - Prototype extensions for built-in types (might move this to pro-to-type eventually)

---

## Cache

The Cache module provides in-memory and persistent caching for various data:

- `index.ts` - Global cache objects (commands, games, timers, etc.)
- `games.ts` - Game backup caching using flat-cache
- `persisted.ts` - Persistent cache utilities
- `reset.ts` - Cache reset utilities

There are both in-memory caches and caches for file-based persistence.

---

## Database

The Database module handles MongoDB connections using Mongoose. The database connection is optional and controlled by the `IS_ENABLED.DB` flag.

---

## Sentinel

The Sentinel module provides hot-reloading capabilities by watching for file changes and automatically reloading affected modules.

- `create.ts` - Creates the file watcher using chokidar
- `hotpatch.ts` - Handles hot-patching of modules
- `process.ts` - Process signal handlers
- `live.ts` - Live reload utilities
- `registers/` - Defines patterns and reload handlers for different file types

When a file changes, Sentinel:

1. Detects the change via chokidar
2. Matches it against registered patterns
3. Triggers the appropriate reload handler
4. Emits events (start, complete, error) for monitoring

This allows the bot to update commands, handlers, and other modules without requiring a full restart.

---

## Secrets

The secrets submodule is handled by either of two linked repositories as submodules - PartBot itself uses
https://github.com/PartMan7/PartBot-secrets, but owing to the need to keep private information, public sources instead
use a public mirror of the same without private information, on https://github.com/PartMan7/PartBot-spoof. If you plan
on contributing to the secrets repository, please check [the docs](https://github.com/PartMan7/PartBot-spoof/blob/main/README.md)
for information on how to set this up.
