import { ActionRowBuilder, type ComponentType, PermissionsBitField, type TextChannel, UserSelectMenuBuilder } from 'discord.js';

import { DiscGames } from '@/cache';
import { clientId } from '@/config/discord';
import { ChatError } from '@/utils/chatError';

import type { NoTranslate } from '@/i18n/types';
import type { DiscCommand } from '@/types/chat';

type History = {
	round: number;
	hands: Record<string, number>;
	available: number;
	calledSum: number;
};

export type JudgementGame = {
	startedBy: string;
	startedAt: number;
	options: { noRepeats?: boolean };
	players: string[];
	playerCount: number;
	round: number;
	history: History[];
	current: {
		round: number;
		available: number;
		hands: Record<string, number>;
		banHands?: Record<string, number>;
		hasStarted: boolean;
	};
};

const Judgement = DiscGames.judgement;

const userMenu = new UserSelectMenuBuilder().setCustomId('judgment_user_selector').setMinValues(4).setMaxValues(5);

export const command: DiscCommand[] = [
	{
		name: 'judgement',
		desc: 'Creates a game',
		args: slash =>
			slash
				.addSubcommand(subcommand => subcommand.setName('create').setDescription('Creates a game.'))
				.addSubcommand(subcommand => subcommand.setName('end').setDescription('Ends the ongoing game.')),
		async run(interaction) {
			const game = Judgement[interaction.channelId];
			if (interaction.options.getSubcommand() === 'end') {
				if (!game) throw new ChatError('No game exists to end.' as NoTranslate);
				if (interaction.user.id !== game.startedBy && interaction.memberPermissions?.has(PermissionsBitField.Flags.KickMembers))
					throw new ChatError('Poke the original creator to end this.' as NoTranslate);
				delete Judgement[interaction.channelId];
				return interaction.reply('Game ended!');
			}
			if (game) throw new ChatError('Game already exists! End it first.' as NoTranslate);
			const userMenuComponent = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userMenu);
			const userSelectInteraction = await interaction.reply({
				content: "Who's playing?",
				components: [userMenuComponent],
				ephemeral: true,
				fetchReply: true,
			});
			try {
				const userSelection = await userSelectInteraction.awaitMessageComponent<ComponentType.UserSelect>({
					filter: author => author.user.id === interaction.user.id,
					time: 60_000,
				});
				const usersSelected = userSelection.users;
				if (usersSelected.has(clientId)) return interaction.editReply({ content: 'Screw you.', components: [] });
				const createdGame = (Judgement[interaction.channelId] = {
					startedBy: interaction.user.id,
					startedAt: Date.now(),
					options: { noRepeats: false },
					players: [...usersSelected.keys()],
					playerCount: usersSelected.size,
					round: 1,
					current: {
						round: 1,
						available: Math.floor(52 / usersSelected.size),
						hands: {},
						hasStarted: false,
					},
					history: [],
				});
				const channel = (await interaction.channel!.fetch()) as TextChannel;
				channel.send(
					[
						`Users: ${usersSelected.map(user => user.displayName).join(', ')}!`,
						"Round 1 is starting. Please note the hands you'll play with /hands.",
						`Tagging players: ${createdGame.players.map(playerId => `<@${playerId}>`).join(' ')}`,
					].join('\n')
				);
				interaction.editReply({ content: 'Players added!', components: [] });
			} catch (e) {
				interaction.editReply({ content: 'No response received.', components: [] });
			}
		},
	},
	{
		name: 'hands',
		desc: 'Calls your number of hands.',
		args: slash => slash.addNumberOption(option => option.setName('count').setDescription('Number of hands').setRequired(true)),
		async run(interaction) {
			const game = Judgement[interaction.channelId];
			if (!game) throw new ChatError('No game exists! Please make a new one with /judgement create.' as NoTranslate);
			const userId = interaction.user.id;
			if (!game.players.includes(userId)) throw new ChatError('Not you; you stink.' as NoTranslate);
			const count = interaction.options.getNumber('count', true);
			if (!(count <= game.current.available && count >= 0))
				throw new ChatError(
					`I don't think it's physically possible to call that many... (total hands available: ${game.current.available})` as NoTranslate
				);
			const oldCall: number | undefined = game.current.hands[userId];
			if (oldCall === count) throw new ChatError(`You already called ${oldCall} hands...` as NoTranslate);
			if (game.current.banHands?.[userId] === count)
				throw new ChatError(`You cannot call ${count} hands (cannot repeat hand count after a conflict).` as NoTranslate);
			game.current.hands[userId] = count;
			interaction.reply({
				content: typeof oldCall === 'number' ? `Changed called hands from ${oldCall} to ${count}.` : `You have called ${count} hands.`,
				ephemeral: true,
			});

			if (Object.values(game.current.hands).length >= game.playerCount) {
				// start next round
				const total = Object.values(game.current.hands).reduce((a, b) => a + b, 0);
				if (total !== game.current.available) {
					if (game.options.noRepeats) game.current.banHands = game.current.hands;
					game.current.hands = {};
					throw new ChatError("The total number of hands doesn't work out! Everyone please call again." as NoTranslate);
				}
				((await interaction.channel!.fetch()) as TextChannel).send(
					`The round has begun! Players have called a total of **${total}** hands this round (out of ${game.current.available} total).`
				);
				game.current.hasStarted = true;
			}
		},
	},
	{
		name: 'next',
		desc: 'Runs the next round of Judgement',
		async run(interaction) {
			const game = Judgement[interaction.channelId];
			if (!game) throw new ChatError('No game exists! Please make a new one with /judgement create.' as NoTranslate);
			if (!game.current.hasStarted)
				throw new ChatError("The round hasn't started yet! Make sure everyone has called first." as NoTranslate);
			game.history.push({
				round: game.round,
				hands: game.current.hands,
				available: game.current.available,
				calledSum: Object.values(game.current.hands).reduce((a, b) => a + b, 0),
			});
			const lastRound = game.history.at(-1)!;

			if (game.current.available === 1) {
				// End game
				interaction.reply(
					[
						`Round #${lastRound.round} has ended. Hands called: ${lastRound.calledSum} of ${lastRound.available}.`,
						`The game has ended! Thanks for playing!`,
					].join('\n')
				);
				delete Judgement[interaction.channelId];
				return;
			}

			game.round++;
			game.current = {
				round: game.round,
				available: game.current.available - 1,
				hands: {},
				hasStarted: false,
			};

			interaction.reply(
				[
					`Round #${lastRound.round} has ended. Hands called: ${lastRound.calledSum} of ${lastRound.available}.`,
					`The next round will have ${game.current.available} total hands. Call your hands using \`/hands\`!`,
					`Tagging players: ${game.players.map(playerId => `<@${playerId}>`).join(' ')}`,
				].join('\n')
			);
		},
	},
];
