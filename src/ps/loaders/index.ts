import { loadAlts } from 'ps/loaders/alts';
import { loadCommands } from 'ps/loaders/commands';

export default function init () {
	loadCommands();
	loadAlts();
}
