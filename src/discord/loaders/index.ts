import { loadCommands } from '@/discord/loaders/commands';

export default async function init(): Promise<void> {
	await loadCommands();
}
