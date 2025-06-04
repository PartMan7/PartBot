import { PSRoomConfigs } from '@/cache';
import { bulkAddPoints } from '@/database/points';
import { SERVER_ID } from '@/discord/constants/servers/hindi';
import getSecretFunction from '@/secrets/functions';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { NoTranslate } from '@/i18n/types';
import type { DiscCommand } from '@/types/chat';

const ROOM = 'hindi';

export const command: DiscCommand = {
	name: 'parselb',
	desc: 'Updates tour points for Hindi via JSON.',
	servers: [SERVER_ID],
	args: slash =>
		slash.addStringOption(opt => opt.setName('tour_data').setDescription('The tour data from `|tournament|end|`.').setRequired(true)),
	async run(interaction) {
		const inputData = interaction.options.getString('tour_data')!;
		const matchedData = inputData.match(/^(?:\|?tournament)?(?:\|?end)?\|?(?<json>\{.*$)/);
		if (!matchedData) return interaction.reply({ content: 'Ummm send me something like `|tournament|end|{...}`', ephemeral: true });

		const jsonData = matchedData.groups!.json;
		const scoringAlgo = getSecretFunction<(tourBracket: string) => Record<string, number> | null>('hindiTourPointsAlgo', () => null);

		const pointsData = scoringAlgo(jsonData);
		if (!pointsData) return interaction.reply('Unable to add data - no response / invalid input!');

		const pointsType = PSRoomConfigs[ROOM].points?.priority[0];
		if (!pointsType) throw new ChatError("Didn't find points data for Hindi..." as NoTranslate);

		const bulkPointsData = Object.fromEntries(
			Object.entries(pointsData).map(([user, points]) => [user, { id: toId(user), name: user, points: { [pointsType]: points } }])
		);
		const res = await bulkAddPoints(bulkPointsData, ROOM);
		if (!res) throw new ChatError('Something went wrong while uploading...' as NoTranslate);

		interaction.reply(
			`Done! Added points: ${Object.entries(pointsData)
				.map(([user, amount]) => [user, amount].join(': '))
				.list()}`
		);
	},
};
