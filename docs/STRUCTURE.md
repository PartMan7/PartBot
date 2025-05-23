# PartBot's Structure

PartBot's layout can be broadly broken down into three 'core' modules and six 'helper' modules.

- PS
- Discord
- Web

and

- Types
- Globals
- Cache
- Database
- Secrets
- Sentinel

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

## SECRETS

The secrets submodule is handled by either of two linked repositories as submodules - PartBot itself uses
https://github.com/PartMan7/PartBot-secrets, but owing to the need to keep private information, public sources instead
use a public mirror of the same without private information, on https://github.com/PartMan7/PartBot-spoof. If you plan
on contributing to the secrets repository, please check [the docs](https://github.com/PartMan7/PartBot-spoof/blob/main/README.md)
for information on how to set this up.
