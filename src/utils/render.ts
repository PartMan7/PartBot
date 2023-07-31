import * as nunjucks from 'nunjucks';

export default function render (path: string, values: object = {}): string {
	return nunjucks.render(fsPath('..', 'views', path + '.njk'), values).trim();
}
