# RegEx sources

### ESLint

```json
"(?:^\\t*(?:let|const) [a-zA-Z]*(?:HTML|[mM]essage) \\+?= (['\"`])[^\\n]*?\\1;$|^\\t*help: (['\"`])[^\\n]*?\\2[;,]$)"
```

```regexfree
(?:
  # HTML lines
  ^\t*(?:let|const)\
  # Variable name must end with HTML or Message
  [a-zA-Z]*(?:HTML|[mM]essage)\ \+?=\
  # The actual string:
  (['"`])[^\n]*?\1
  ;$
  |
  # Or a help message!
  ^\t*help:\ (['"`])[^\n]*?\2[;,]$
)
```

---

### units.tsx (feet-inches)

```regexfree
\b
(?:
  # feet, optional inches
  (?:
    (\d{1,5}(?:[\.,]\d{1,5})?)
    (?:\ ?f(?:eet|oot|t)|(?<!(?:^|\s)'[^']*)'(?![a-z]))
    (?:
      (?:(?:\ and|\ &|,)?)\ ?
      ((?:\d{1,5}(?:[\.,]\d{1,5})?))
      (?:\ ?inch(?:es)?|in|"|)
    )?
  |
    # inches only
    ((?:\d{1,5}(?:[\.,]\d{1,5})?))
    (?:\ ?inch(?:es)?|in|")
  )
)
(?:\b|\ |$)
```

---

Shoutouts to [RegExFree](https://zarel.github.io/regexfree/)!
