const path = require('path');

const TYPE_ERROR_MESSAGE = "Argument of type 'Element' is not assignable to parameter of type 'string'.";
const UMD_SUGGESTION_MESSAGE = " refers to a UMD global, but the current file is a module. Consider adding an import instead.'";

function init() {
	function create(info) {
		const PS_PROJECT_PATH = path.join(info.project.compilerOptions.baseUrl, 'ps');
		const proxy = Object.create(null);
		for (const k of Object.keys(info.languageService)) {
			const x = info.languageService[k];
			proxy[k] = (...args) => x.apply(info.languageService, args);
		}

		// Remove the automatically-hydrated irrelevant type errors
		proxy.getSemanticDiagnostics = fileName => {
			const prior = info.languageService.getSemanticDiagnostics(fileName);
			if (!fileName.startsWith(PS_PROJECT_PATH)) return prior;
			return prior.filter(err => !err.messageText.includes(TYPE_ERROR_MESSAGE));
		};

		// Remove UMD global suggestions
		proxy.getSuggestionDiagnostics = fileName => {
			const prior = info.languageService.getSuggestionDiagnostics(fileName);
			return prior.filter(err => err.messageText.endsWith(UMD_SUGGESTION_MESSAGE));
		};
		return proxy;
	}
	return { create };
}
module.exports = init;
