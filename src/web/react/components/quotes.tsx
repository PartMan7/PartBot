import type { CSSProperties, ReactElement } from 'react';

export type QuoteResponse = { html: string };

const pageStyle: CSSProperties = {
	backgroundImage: "url('https://play.pokemonshowdown.com/fx/client-bg-shaymin.jpg')",
	backgroundSize: 'cover',
	overflow: 'auto',
	height: '100vh',
};

const scrollStyle: CSSProperties = {
	fontFamily: 'Verdana, Helvetica, Arial, sans-serif',
	maxWidth: 'min(80%, 1200px)',
	margin: 'auto',
	height: '100%',
	maxHeight: '100%',
	overflowY: 'auto',
	padding: 30,
	color: '#ddd',
};

const quoteStyle: CSSProperties = {
	border: '2px double white',
	borderRadius: 7,
	padding: 10,
	background: 'rgba(0,0,0,.8)',
	margin: 10,
	wordWrap: 'break-word',
};

const numStyle: CSSProperties = {
	fontSize: '10pt',
	padding: 2,
	background: 'rgba(0,0,0,.7)',
	borderRadius: 5,
};

const linkStyle: CSSProperties = {
	color: '#8cf',
	textDecoration: 'underline',
	fontSize: '10pt',
	padding: '4px 8px',
	background: 'rgba(0,0,0,.7)',
	borderRadius: 5,
};

export function Quotes({ quotes, room, random }: { quotes: QuoteResponse[]; room: string; random: boolean }): ReactElement {
	return (
		<div style={pageStyle}>
			<link rel="stylesheet" href="/api/quotes/styles.css" />
			<div style={scrollStyle}>
				<p style={{ margin: '0 10px 10px' }}>
					{random ? (
						<>
							<a style={linkStyle} href={`/quotes/${room}/random`}>
								Another one
							</a>{' '}
							·{' '}
							<a style={linkStyle} href={`/quotes/${room}`}>
								All quotes
							</a>
						</>
					) : (
						<a style={linkStyle} href={`/quotes/${room}/random`}>
							Random quote
						</a>
					)}
				</p>
				{quotes.map((quote, i) => (
					<div key={i}>
						{!random && <span style={numStyle}>{i + 1})</span>}
						<div style={quoteStyle} dangerouslySetInnerHTML={{ __html: quote.html }} />
						{i < quotes.length - 1 && <hr />}
					</div>
				))}
			</div>
		</div>
	);
}
