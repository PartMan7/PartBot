# PartBot
### (but better)


# RegEx sources

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