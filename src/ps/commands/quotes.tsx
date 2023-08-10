import React = require('react');
import { renderToStaticMarkup } from 'react-dom/server';

export default {
	name: 'quotes',
	aliases: ['q'],
	help: 'Quotes! ',
	async run (message) {
		message.reply('Test');
		// message.reply(renderToStaticMarkup(<b>Test</b>));
		// message.sendHTML(renderToStaticMarkup(<b>Test</b>));
		// log(message.parent.rooms, message.parent);
	}
} as PSCommand;
