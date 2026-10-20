## tsconfig.json

```json
{
	"compilerOptions": {
		"module": "preserve",
		"esModuleInterop": true,
		"types": ["bun", "node"]
	}
}
```

Path aliases (`@/*`) are read from `paths` by Bun at runtime and by `bun check` for type checking.

Hot reload uses `require.cache` eviction in [src/utils/cachebust.ts](../src/utils/cachebust.ts); always resolve paths with `require.resolve` so cache keys match the loader (notably `/private/var` vs `/var` on macOS).
