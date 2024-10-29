import path from 'path';

export async function readFileStructure(root: string): Promise<Record<string, string>> {
	const files = await fs.readdir(root, { recursive: true });
	return files
		.filter(file => /\.tsx?$/.test(file))
		.reduce<Record<string, string>>((acc, file) => {
			const label = file
				.replace(/\.tsx?$/, '')
				.replace('/index', '')
				.replace(/[(\w+)]/, ':$1');
			acc[`/${label}`] = path.join(root, file);
			return acc;
		}, {});
}
