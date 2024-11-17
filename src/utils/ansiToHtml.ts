import { escapeHTML } from 'ps-client/tools';

const bold = Object.entries({
	'\x1B[1m': '<b>',
	'\x1B[22m': '</b>',
});

const colours = Object.entries({
	'\x1B[30m': '#000000',
	'\x1B[31m': '#CC3333',
	'\x1B[32m': '#0DBC79',
	'\x1B[33m': '#E5E510',
	'\x1B[34m': '#2472C8',
	'\x1B[35m': '#BC3FBC',
	'\x1B[36m': '#11A8CD',
	'\x1B[37m': '#E5E5E5',
	'\x1B[39m': '',
	'\x1B[90m': '#666666',
});

export function ansiToHtml(input: string): string {
	const filledWithSpans = `<span>${colours.reduce<string>(
		(text, [code, hex]) => {
			return text.replaceAll(code, `</span><span${hex ? ` style="color:${hex}"` : ''}>`);
		},
		bold.reduce((text, [code, tag]) => text.replaceAll(code, tag), escapeHTML(input))
	)}</span>`;
	return filledWithSpans.gsub(/<span>(.*?)<\/span>/g, '$1');
}
