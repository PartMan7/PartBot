import type { APIRoute } from '@/types/web';
import type { RequestHandler } from 'express';

const css = `
.ps-quote {
	.chat, .message {
		font-size: 9pt;
	}

	small {
		font-weight: normal;
		font-size: 8pt;
	}

	.gray {
		color: #888;
	}

	em {
		font-style: normal;
		padding: 0 4px 0 3px;
	}

	.greentext {
		color: #187902;
	}

	details.readmore {
		summary {
			display: block;
			font-size: 9pt;
			list-style: none;
			cursor: pointer;

			&::-webkit-details-marker {
				display: none;
			}

			&::after {
				content: '[read more]';
				font-family: Verdana, sans-serif;
				margin-left: 0.5em;
				color: #888;
			}

			&:hover {
				background: rgba(119, 153, 187, 0.15);

				&::after {
					text-decoration: underline;
					color: #68b;
				}
			}
		}

		&[open] summary::after {
			content: '';
		}
	}
}
`;

export const headers = [['Access-Control-Allow-Origin', '*']] satisfies APIRoute['headers'];

export const handler: RequestHandler = (_req, res) => {
	res.type('css').send(css);
};
