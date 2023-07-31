# PartBot
### (but better)
Hiya! This is an ongoing effort to rewrite [PartBot](https://github.com/PartMan7/PartBot) from the bottom-up, with better practices than the steaming pile of bamboo sticks that supports PartBot. Goals for this rewrite are:

* Use properly-laid-out methods for keeping the codebase public and secure while maintaining the ability to have hidden components (for security and staff purposes).
* Have an extensible, reusible, (cross-platform, maybe?), robust command structure that allows for maximum enforcement of DRY principles.
* Abstract out the most common utilities into simple-to-access mechanisms (see: PS-Client's message replying, subcommands, easily-accessible utilities with a lot less global pollution).
* Keep the codebase as stable and typesafe as possible.
* Retain the ability to have dynamic hotpatches using a Sentinel-like system (see [PartBot](https://github.com/PartMan7/PartBot/blob/master/handlers/watcher.js) for reference).
* Have proper rendering systems in place for both PS-side and site-side HTML rendering (will be using Nunjucks and React respectively).
* Faster and more efficient logging (with the additional requirement of persistence and performance).
* More widespread and consistent applications of standard code (promises over sync, enforced global lint).
* Preference of database collections over dynamic datafiles for everything except PS datasources.
* Proper, up-to-date, and fleshed-out Discord command handler (this sadly extends to slash commands).
* Centralized and documented configuration files (`src/config` and `.env`).
* Add flags to commands, for functions like segregating in lists, whitelisting/blacklisting from usage, and managing permissions.


This might take ages, but it'll be worth it!

Also I wholeheartedly welcome contributors (as opposed to the original PartBot, where the source was private and only had a public mirror). If you'd like to contribute to this repository but don't know where to start or what's currently in-progress, hit me up on any platform!


### RegEx sources

Lint:
```json
"(?:^\\t*(?:let|const) [a-zA-Z]*(?:HTML|[mM]essage) \\+?= (['\"`])[^\\n]*?\\1;$|^\\t*help: (['\"`])[^\\n]*?\\2[;,]$)"
```
```regexfree
(?:
  # HTML lines
  ^\t*(?:let|const)\ 
  # Variable name must end with HTML
  [a-zA-Z]*(?:HTML|[mM]essage)\ \+?=\ 
  # The actual string:
  (['"`])[^\n]*?\1
  ;$
  |
  # Or a help message!
  ^\t*help:\ (['"`])[^\n]*?\2[;,]$
)
```
<small>Shoutouts to [RegExFree](https://zarel.github.io/regexfree/)!</small>
