export const command: PSCommand = {
	name: 'git',
	help: 'Links the GitHub repository',
	syntax: 'CMD',
	async run ({ broadcast }) {
		broadcast('https://github.com/PartMan7/PartBotter');
	}
};
