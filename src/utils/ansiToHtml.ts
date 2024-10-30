import { escapeHTML } from 'ps-client/tools';
import util from 'util'; // donotpush

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
});

export function ansiToHtml(input: string): string {
	const filledWithSpans = `<span>${colours.reduce<string>((text, [code, hex]) => {
		return text.replaceAll(code, `</span><span${hex ? ` style="color:${hex}"` : ''}>`);
	}, escapeHTML(input))}</span>`;
	return filledWithSpans.gsub(/<span>(.*?)<\/span>/g, '$1');
}
