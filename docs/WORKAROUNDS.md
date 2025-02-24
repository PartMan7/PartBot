## tsconfig.json

```json
{
	"compilerOptions": {
		"module": "commonjs", // 'require' syntax makes HMR possible; 'import' doesn't
		"esModuleInterop": true // Allow default-importing stuff like path
	},
	"ts-node": {
		"require": ["tsconfig-paths/register"] // For path aliases
	}
}
```
