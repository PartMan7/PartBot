import ts, { CompilerHost, CompilerOptions, Program, TransformationContext, SourceFile, Node } from 'typescript';
import { PluginConfig, ProgramTransformerExtras } from 'ts-patch';

function getPatchedHost (
	maybeHost: CompilerHost | undefined,
	tsInstance: typeof ts,
	compilerOptions: CompilerOptions
): CompilerHost & { fileCache: Map<string, SourceFile> } {
	const fileCache = new Map();
	const compilerHost = maybeHost ?? tsInstance.createCompilerHost(compilerOptions, true);
	const originalGetSourceFile = compilerHost.getSourceFile;

	return Object.assign(compilerHost, {
		getSourceFile (_fileName: string, languageVersion: ts.ScriptTarget, ...args) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore -- FIXME
			const fileName = tsInstance.normalizePath(_fileName);
			if (fileCache.has(fileName)) return fileCache.get(fileName);

			const sourceFile = originalGetSourceFile(fileName, languageVersion, ...args);
			fileCache.set(fileName, sourceFile);

			return sourceFile;
		},
		fileCache
	});
}

export default function transformProgram (
	program: Program,
	host: CompilerHost | undefined,
	config: PluginConfig,
	{ ts: tsInstance }: ProgramTransformerExtras,
): Program {
	const compilerOptions = program.getCompilerOptions();
	const compilerHost = getPatchedHost(host, tsInstance, compilerOptions);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore -- FIXME
	const rootFileNames: string[] = program.getRootFileNames().map(tsInstance.normalizePath);

	/* Transform AST */
	const transformedSource = tsInstance.transform(
		program.getSourceFiles().filter(sourceFile =>
			rootFileNames.includes(sourceFile.fileName) &&
			/src\/ps\/.*\.tsx$/.test(sourceFile.fileName)
		),
		[transformAst.bind(tsInstance)],
		compilerOptions
	).transformed;

	const { printFile } = tsInstance.createPrinter();
	for (const sourceFile of transformedSource) {
		const { fileName, languageVersion } = sourceFile;
		const updatedSourceFile = tsInstance.createSourceFile(fileName, printFile(sourceFile), languageVersion);
		compilerHost.fileCache.set(fileName, updatedSourceFile);
	}

	return tsInstance.createProgram(rootFileNames, compilerOptions, compilerHost);
}

function transformAst (context: TransformationContext) {
	return (sourceFile: ts.SourceFile) => {
		function visit (node: Node): Node {
			if (ts.isFunctionDeclaration(node) && /^[A-Z]/.test(node.name.text)) {
				return node; // Don't touch JSX inside a function with a capitalized name
			} else if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
				// TODO Exit early if node is in a named function that starts with a capital letter
				// Wrap the topmost JSX with jsxToHTML
				return context.factory.createCallExpression(
					context.factory.createIdentifier('jsxToHTML'),
					undefined,
					[node]
				);
			} else return ts.visitEachChild(node, visit, context);
		}
		return this.visitNode(sourceFile, visit);
	};
}
