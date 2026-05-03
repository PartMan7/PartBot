import { CronJob } from 'cron';
import { EmbedBuilder } from 'discord.js';
import Parser from 'rss-parser';

import { usePersistedCache } from '@/cache/persisted';
import { getChannel } from '@/discord/loaders/channels';
import { TimeZone } from '@/ps/handlers/cron/constants';
import { Logger } from '@/utils/logger';

const XKCD_CHANNEL_ID = '762324232948023316';
const COMIC_IN_LINK = /xkcd\.com\/(\d+)(?:\/|$)/;

const cache = usePersistedCache('xkcdLastProcessedIndex');
const rssParser = new Parser();

export const jobs: CronJob[] = [];

export function closeJobs(): void {
	jobs.forEach(job => job.stop());
	jobs.length = 0;
}

async function pollXkcdFeed(): Promise<void> {
	const { items } = await rssParser.parseURL('https://xkcd.com/rss.xml');
	if (!items.length) throw new Error('XKCD RSS: empty');

	const headLink = items[0].link;
	const match = headLink?.match(COMIC_IN_LINK);
	if (!match) throw new Error(`XKCD RSS: bad headline link (${headLink})`);

	const newestInFeed = Number(match[1]);
	const stored = cache.get();

	if (newestInFeed <= stored) return;

	cache.set(newestInFeed);

	const channel = getChannel(XKCD_CHANNEL_ID);
	if (!channel) throw new Error(`XKCD: channel ${XKCD_CHANNEL_ID}`);

	const pageUrl = `https://xkcd.com/${newestInFeed}/`;
	const jsonResponse = await fetch(`${pageUrl}info.0.json`);
	if (!jsonResponse.ok) throw new Error(`xkcd #${newestInFeed}: info.0.json HTTP ${jsonResponse.status}`);

	const comic = (await jsonResponse.json()) as { title?: string; alt?: string; img?: string };
	if (!comic.img) throw new Error(`xkcd #${newestInFeed}: no img`);

	const embed = new EmbedBuilder()
		.setTitle(comic.title ? `${comic.title} - #${newestInFeed}` : `#${newestInFeed}`)
		.setURL(pageUrl)
		.setImage(comic.img)
		.setColor('Purple')
		.setFooter({ text: `xkcd #${newestInFeed}` });

	if (comic.alt) embed.setDescription(comic.alt.slice(0, 4096));

	await channel.send({ embeds: [embed] });
}

export function initFeedCheck(): void {
	jobs.push(
		CronJob.from({
			name: 'xkcd-feed-check',
			cronTime: '0 * * * *',
			start: true,
			timeZone: TimeZone.GMT,
			waitForCompletion: true,
			errorHandler: err => Logger.errorLog(err as Error),
			onTick: pollXkcdFeed,
		})
	);
}
