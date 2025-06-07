/* eslint-disable max-len */

import type { AvailableTranslations } from '@/i18n/types';

export default {
	GRAMMAR: {
		AND: 'e',
		OR: 'ou',
	},

	ACCESS_DENIED: 'Acesso negado.',
	SCREW_YOU: ['É, não', 'Sai fora!', 'Vai se danar.'],
	CANCELLED: 'Esta ação foi cancelada.',
	CMD_NOT_FOUND: 'Comando não encontrado.',
	CONFIRM: "Tem certeza? Digite 'confirmar' para confirmar.",
	NOT_CONFIRMED: 'Não recebi confirmação a tempo.',
	INVALID_ALIAS: 'Apelido inválido para {{aliasFor}}.',
	INVALID_ROOM_ID: 'ID da sala inválido.',
	NO_DMS_COMMAND: 'Este comando não pode ser usado em mensagens privadas.',
	NOT_IN_ROOM: 'Você não está nessa sala.',
	PM_ONLY_COMMAND: 'Este comando só pode ser usado em mensagens privadas.',
	ROOM_ONLY_COMMAND: 'Este comando só pode ser usado em uma sala de bate-papo.',
	TOO_LATE: 'Tarde demais!',
	USER_NOT_FOUND: 'Usuário não encontrado!',
	WRONG_ROOM: 'Sala errada.',
	INVALID_ARGUMENTS: 'Número inválido de argumentos.',
	ENTRY_NOT_FOUND: 'Entrada não encontrada.',

	DISABLED: {
		DB: 'O banco de dados está desativado no momento.',
	},

	MONS: {
		NOT_FOUND: 'Pokémon {{name}} não encontrado.',
	},

	GAME: {
		ALREADY_JOINED: 'Você já entrou neste jogo.',
		ALREADY_STARTED: 'O jogo já começou!',
		ALREADY_WATCHING: 'Você já está assistindo este jogo!',
		COMMAND_NOT_ENABLED: 'Este comando não está habilitado para {{game}}.',
		DRAW: 'O jogo entre {{players}} terminou em empate!',
		ENDED: 'O jogo de {{game}} [{{id}}] foi encerrado.',
		ENDED_AUTOMATICALLY: 'O jogo de {{game}} [{{id}}] foi encerrado automaticamente.',
		IMPOSTOR_ALERT: [
			'Ei! Seu ID não confere!',
			'Meio suspeito, se quer saber...',
			'Espera aí, você não é o jogador certo!',
			'Você não é o escolhido.',
		],
		INVALID_INPUT: 'Essa entrada não parece funcionar...',
		INVALID_SIDE: 'Lado inválido escolhido! Os lados válidos são: {{sides}}',
		IN_PROGRESS: 'Este jogo já está em andamento. Otaku.',
		IS_FULL: 'O jogo não tem mais espaço para jogadores.',
		NOT_FOUND: 'Não consegui encontrar o jogo que você quis dizer...',
		NOT_PLAYING: [
			'Você não é um jogador!',
			'Você não está jogando, otaku.',
			'Você não parece ser um jogador?',
			'Jogador não encontrado. Ou algo assim.',
		],
		NOT_STARTED: 'O jogo ainda não começou.',
		CANNOT_START: 'Não é possível iniciar o jogo! Verifique os jogadores.',
		NOT_WATCHING: 'Você não está assistindo este jogo...',
		NOW_WATCHING: 'Você agora está assistindo o jogo de {{game}} entre {{players}}.',
		NO_LONGER_WATCHING: 'Você não está mais assistindo o jogo de {{game}} entre {{players}}.',
		RESTORED: 'Jogo {{id}} foi restaurado.',
		RESTORING_WRONG_TYPE: 'Parece que você está tentando restaurar o tipo errado de jogo...',
		STASHED: 'Jogo {{id}} armazenado com sucesso.',
		SUB: '{{out}} foi substituído por {{in}}!',
		WATCHING_NOTHING: 'Você não parece precisar voltar a nada...',
		WON: '{{winner}} venceu!',
		WON_AGAINST: '{{winner}} venceu o jogo de {{game}} contra {{loser}}{{ctx}}!',
		WAITING: 'Esperando você jogar...',
		NON_PLAYER_OR_SPEC: 'Usuário não está entre jogadores/espectadores',
		YOUR_TURN: 'Sua vez!',
		UPLOAD_FAILED: 'Falha ao enviar o jogo {{id}}.',
		MOD_NOT_FOUND: "Não foi possível encontrar um mod chamado '{{mod}}'.",
		CANNOT_MOD: 'Mods não podem ser aplicados a este jogo agora.',
		APPLIED_MOD: '{{mod}} foi aplicado ao jogo {{id}}.',
		NO_THEME_SUPPORT: '{{game}} não suporta temas.',
		INVALID_THEME: 'Tema inválido. Temas válidos são: {{themes}}.',
		SET_THEME: 'O tema foi definido como {{theme}}.',
		CANNOT_LEAVE: 'Você não pode desistir de um jogo apenas fechando! Tente ``{{prefix}}{{game}} forfeit``.',
		TIMER: {
			PRIVATE: 'Ei, é sua vez de jogar em {{game}} [{{id}}]',
			PUBLIC: '{{user}} não jogou em {{game}} [{{id}}] há {{time}}...',
		},

		LIGHTS_OUT: {
			INVALID_SIZE: 'Lights Out só pode ter de 3x5 a 9x10.',
		},
		MASTERMIND: {
			ENDED: 'O jogo de Mastermind foi encerrado para {{player}}.',
			FAILED: '{{player}} não conseguiu adivinhar {{solution}} em {{cap}} tentativas.',
		},
		SCRABBLE: {
			NO_SELECTED: 'Você precisa selecionar uma célula antes de jogar. Use os botões!',
			TILE_MISMATCH: 'Essa jogada não parece corresponder às peças no tabuleiro – tentou colocar {{placed}} em {{actual}}.',
			MISSING_LETTER: 'Você não tem nenhuma peça para {{letter}}.',
			INSUFFICIENT_LETTERS: 'Você só tem {{actual}} peças de {{letter}}, mas precisa de {{required}}.',
			BAG_SIZE: 'Restam {{amount}} peças na bolsa.',
			TOO_MUCH_PASSING: 'O jogo acabou por muitos passes!',
			FIRST_MOVE_CENTER: 'A primeira jogada deve passar pelo centro do tabuleiro!',
			FIRST_MOVE_MULTIPLE_TILES: 'Você não pode jogar apenas uma peça na primeira jogada.',
			MUST_BE_CONNECTED: 'Todas as jogadas no Scrabble devem se conectar com as peças existentes!',
			MUST_PLAY_TILES: 'Sua jogada deve usar pelo menos uma peça.',
			INVALID_WORD: '{{wordList}} não é uma palavra válida.',
			INVALID_WORDS: '{{wordList}} não são palavras válidas.',
			VALID_WORD: '{{word}} é uma palavra válida em {{mod}}.',
			HOW_TO_BLANK:
				"Oi, você pegou uma peça branca! Uma peça branca pode ser usada como qualquer letra, mas vale 0 pontos. Você pode digitar `BL[A]NK` (por exemplo) para usá-la como A. Outros formatos: `BL(A)NK`, ou adicionando um apóstrofo após a letra (ex: `BLA'NK`). *(⚠️ revisão recomendada para fluidez e clareza para jogadores portugueses ou brasileiros.)*",
		},
	},

	COMMANDS: {
		ALTS: 'Alternativas: {{alts}}',
		BOOP: 'BOOP',
		UPTIME: 'O Bot está rodando há {{time}}.',
		RANK: 'Sua classificação é {{rank}}.',
		PONG: 'Pong!',
		ROOM_NOT_GIVEN: 'Não recebi uma sala dentro de um minuto',

		EVAL: {
			SUCCESS: 'Comando executado com sucesso.',
			ERROR: 'Erro ao executar comando: {{error}}',
		},

		POINTS: {
			ROOM_NO_POINTS: '{{room}} não tem pontos ativados.',
			USER_NO_POINTS: '[[]]{{user}} não tem pontos nesta sala.',
			USER_POINTS: '[[]]{{user}} tem {{pointsList}} em {{roomName}}.',
			USER_POINTS_RANKED: '[[]]{{user}} está classificado em #{{rank}} com {{pointsList}} em {{roomName}}.',
			HEADERS: {
				USER: 'Usuário',
			},
		},

		QUOTES: {
			NO_QUOTES_FOUND: 'Nenhuma citação encontrada.',
		},

		TIMER: {
			NONE_RUNNING: 'Você não tem nenhum cronômetro em andamento!',
			ENDS_IN: 'Seu cronômetro termina em {{timeLeft}}{{comment}}.',
			WOULD_HAVE_ENDED_IN: '(O cronômetro teria terminado em {{timeLeft}}.)',
			CANCELLED: 'Seu cronômetro{{comment}} foi cancelado com {{timeLeft}} restantes.',
			MAX_TIME: 'Cronômetros podem durar no máximo uma semana.',
			INVALID_TIME: 'Por favor, especifique um tempo para o cronômetro! (Não se esqueça das unidades)',
			TIMER_END: '{{user}}, seu cronômetro acabou!',
			TIMER_END_WITH_COMMENT: '{{user}}, seu cronômetro acabou! Motivo: {{comment}}',
			TIMER_SET: 'Seu cronômetro foi definido para {{timeLeft}} a partir de agora.',
		},
	},
} satisfies AvailableTranslations;
