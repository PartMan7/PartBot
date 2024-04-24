# PartBot's Structure

PartBot's layout can be broadly broken down into three 'core' modules and five 'helper' modules.

* PS
* Discord
* Web

and

* Types
* Globals
* Cache
* Database
* Sentinel

---

## PS
The PS module has three parts - `commands`, `handlers`, and `loaders`.

### Commands

The `commands` directory stores all PS commands. A single file can export one or multiple commands, and each
command has configuration options. By convention, 'barrel' commands (such as `GAMES.tsx`) that export multiple
commands are named with capital letters.

Commands may be either `.ts` or `.tsx` files - the `.tsx` extension is required to enable JSX syntax in the code.

Please note that **JSX syntax that is not inside another JSX function/call will be converted to a string**. This is
applicable to all `tsx` files inside the `ps` folder - so patterns like `message.replyHTML(<b>Access denied.</b>)` can
be used. This is reflected in both `tsc` checks as well as the actual chatbot with `npm start`, but IDEs like WebStorm and Visual Studio Code have slight differencess due to needing a custom Language Service Plugin.


### Handlers

The `handlers` directory contains all PS event handlers as well as permissions management. Read the source code for
more details.

### Loaders

The `loaders` directory contains code to load data from a database into cache. This lets the bot synchronize data such as
alts and roomconfigs. It also contains the TypeScript plugin to convert JSX into HTML within the `ps` folder by injecting
a `jsxToHTML` call.


---
