/* eslint-disable max-len */

import type { AvailableTranslations } from '@/i18n/types';

export default {
	GRAMMAR: {
		AND: 'e',
		OR: 'ou',
	},

	ACCESS_DENIED: 'Acesso negado.',
	SCREW_YOU: 'Vai se danar.',
	CANCELLED: 'Esta ação foi cancelada.',
	CMD_NOT_FOUND: 'Comando não encontrado.',
	CONFIRM: "Tem certeza? Digite 'confirm' para confirmar.",
	NOT_CONFIRMED: 'Confirmação não recebida a tempo.',
	INVALID_ALIAS: 'Alias inválido para {{aliasFor}}.',
	INVALID_ROOM_ID: 'ID da sala inválido.',
	NO_DMS_COMMAND: 'Este comando não pode ser executado por mensagem privada.',
	NOT_IN_ROOM: 'Você não está nessa sala.',
	PM_ONLY_COMMAND: 'Este comando só pode ser usado em mensagens privadas.',
	ROOM_ONLY_COMMAND: 'Este comando só pode ser usado em uma sala de chat.',
	TOO_LATE: 'Tarde demais!',
	USER_NOT_FOUND: 'Usuário não encontrado!',
	WRONG_ROOM: 'Sala errada.',
	INVALID_ARGUMENTS: 'Número de argumentos inválido.',
	ENTRY_NOT_FOUND: 'Entrada não encontrada.',

	DISABLED: {
		DB: 'O banco de dados está atualmente desativado.',
	},

	MONS: {
		NOT_FOUND: 'Pokémon {{name}} não encontrado.',
	},

	GAME: {
		LABELS: {
			END: 'Finalizar',
			JOIN: 'Entrar',
			JOIN_SIDE: 'Entrar ({{side}})',
			RANDOM: 'Aleatório',
			START: 'Iniciar',
			STASH: 'Guardar',
			UNSTASH: 'Restaurar',
			WATCH: 'Assistir',
		},
		SIGNUPS_OPEN: 'As inscrições para {{game}} estão abertas!',
		SIGNUPS_CLOSED: 'Inscrições para {{game}} encerradas.',
		ALREADY_JOINED: 'Você já entrou neste jogo.',
		ALREADY_STARTED: 'O jogo já começou!',
		ALREADY_WATCHING: 'Você já está assistindo este jogo!',
		COMMAND_NOT_ENABLED: 'Este comando não está habilitado para {{game}}.',
		DRAW: 'O jogo entre {{players}} terminou em empate!',
		ENDED: 'O jogo de {{game}} [{{id}}] foi encerrado.',
		ENDED_AUTOMATICALLY: 'O jogo de {{game}} [{{id}}] acabou automaticamente.',
		IMPOSTOR_ALERT: [
			'Espere! Seu ID não confere!',
			'Tá meio suspeito, posso dizer...',
			'Espere, você não é o jogador certo!',
			'Você não é o escolhido.',
		],
		INVALID_INPUT: 'Essa entrada não parece funcionar...',
		INVALID_SIDE: 'Lado inválido escolhido! Os lados válidos são: {{sides}}',
		IN_PROGRESS: 'Este jogo já está em andamento. Weeb.',
		IS_FULL: 'Não há mais espaço para jogadores.',
		NOT_FOUND: 'Não foi possível encontrar o jogo que você quis dizer...',
		NOT_PLAYING: [
			'Você não é um jogador!',
			'Você não está jogando, weeb.',
			'Você não parece ser um jogador?',
			'Jogador não encontrado. Ou algo assim.',
		],
		NOT_STARTED: 'O jogo ainda não começou.',
		CANNOT_START: 'Não é possível iniciar o jogo! Verifique os jogadores.',
		NOT_WATCHING: 'Você não está assistindo este jogo...',
		NOW_WATCHING: 'Você agora está assistindo o jogo de {{game}} entre {{players}}.',
		NO_LONGER_WATCHING: 'Você não está mais assistindo o jogo de {{game}} entre {{players}}.',
		RESTORED: 'Jogo {{id}} restaurado.',
		RESTORING_WRONG_TYPE: 'Parece que você está restaurando o tipo errado de jogo...',
		STASHED: 'Jogo {{id}} armazenado com sucesso.',
		SUB: '{{out}} foi substituído por {{in}}!',
		DQ: '{{player}} foi desclassificado do jogo.',
		FORFEIT: 'Você desistiu do jogo.',
		REMOVED: '{{player}} foi removido do jogo.',
		LEFT: 'Você saiu do jogo.',
		WATCHING_NOTHING: 'Parece que você não precisa entrar em nenhum jogo...',
		WON: '{{winner}} venceu!',
		WON_AGAINST: '{{winner}} venceu o jogo de {{game}} contra {{loser}}{{ctx}}!',
		WAITING: 'Esperando você jogar...',
		NON_PLAYER_OR_SPEC: 'Usuário não está nos jogadores/espectadores',
		YOUR_TURN: 'Sua vez!',
		WAITING_FOR_OPPONENT: 'Esperando pelo adversário...',
		WAITING_FOR_PLAYER: 'Esperando por {{player}}...',
		GAME_ENDED: 'Jogo encerrado.',
		UPLOAD_FAILED: 'Falha ao enviar o jogo {{id}}.',
		MOD_NOT_FOUND: "Não foi possível encontrar um mod chamado '{{mod}}'.",
		CANNOT_MOD: 'Mods não podem ser aplicados a este jogo agora.',
		APPLIED_MOD: '{{mod}} foi aplicado ao jogo {{id}}.',
		NO_THEME_SUPPORT: '{{game}} não suporta temas.',
		INVALID_THEME: 'Tema inválido. Temas válidos são: {{themes}}.',
		SET_THEME: 'O tema foi definido como {{theme}}.',
		CANNOT_LEAVE: 'Você não pode desistir fechando o jogo! Tente ``{{prefix}}{{game}} forfeit`` em vez disso.',
		NO_GAMES_FOUND: 'Nenhum jogo encontrado.',
		NO_BACKUPS_FOUND: 'Nenhum backup de jogo encontrado.',
		TIMER: {
			PRIVATE: 'Psst é sua vez de jogar em {{game}} [{{id}}]',
			PUBLIC: '{{user}} não jogou em {{game}} [{{id}}] por {{time}}...',
		},

		LIGHTS_OUT: {
			INVALID_SIZE: 'Lights Out só pode ser de 2x2 a 15x15.',
		},
		MASTERMIND: {
			ENDED: 'O jogo de Mastermind foi encerrado para {{player}}.',
			FAILED: '{{player}} não conseguiu adivinhar {{solution}} em {{cap}} tentativas.',
		},
		SCRABBLE: {
			NO_SELECTED: 'Você deve primeiro selecionar uma célula para jogar. Use os botões!',
			TILE_MISMATCH: 'Esse movimento não combina com as peças no tabuleiro – tentou colocar {{placed}} em {{actual}}.',
			MISSING_LETTER: 'Você não tem peças para {{letter}}.',
			INSUFFICIENT_LETTERS: 'Você tem apenas {{actual}} peças de {{letter}}, mas são necessárias {{required}}.',
			BAG_SIZE: 'Restam {{amount}} peças no saco.',
			TOO_MUCH_PASSING: 'O jogo terminou devido a muitas passadas!',
			FIRST_MOVE_CENTER: 'O primeiro movimento deve passar pelo centro do tabuleiro!',
			FIRST_MOVE_MULTIPLE_TILES: 'Você não pode jogar apenas uma peça no primeiro movimento.',
			MUST_BE_CONNECTED: 'Todos os movimentos no Scrabble devem estar conectados ao resto do tabuleiro!',
			MUST_PLAY_TILES: 'Seu movimento deve jogar pelo menos uma peça.',
			INVALID_WORD: '{{wordList}} não é uma palavra válida.',
			INVALID_WORDS: '{{wordList}} não são palavras válidas.',
			VALID_WORD: '{{word}} é uma palavra válida em {{mod}}.',
			HOW_TO_BLANK:
				"Oi, você pegou uma peça em branco! Uma peça em branco pode representar qualquer letra, mas não dá pontos. Você pode digitar `BL[A]NK` (por exemplo) para usá-la como A. Outras sintaxes suportadas são `BL(A)NK` ou adicionar um apóstrofo após a letra (ex: `BLA'NK`).",
		},
	},

	COMMANDS: {
		HELP: {
			MESSAGE_1: 'Oi! Eu sou <USERNAME />, e vou tentar ajudar você o melhor que puder.',
			MESSAGE_2:
				'Para começar, gostaria de ver alguns <COMMANDS /> que você pode usar? Ou talvez dar uma olhada no meu <SOURCE_CODE />?',
			COMMANDS: 'comandos',
			SOURCE_CODE: 'código fonte',
			COULD_NOT_FIND_COMMAND: 'Não foi possível encontrar o comando.',
			PM_ONLY: 'Só pode ser usado em mensagens privadas.',
			ALLOW_PMS: 'Pode ser usado em mensagens privadas.',
		},
		ALTS: 'Alts: {{alts}}',
		BOOP: 'BOOP',
		UPTIME: 'O Bot está ativo há {{time}}.',
		RANK: 'Seu ranking é {{rank}}.',
		PONG: 'Pong!',
		ROOM_NOT_GIVEN: 'Não foi recebida uma sala dentro de um minuto',

		EVAL: {
			SUCCESS: 'Comando executado com sucesso.',
			ERROR: 'Erro ao executar o comando: {{error}}',
		},

		POINTS: {
			ROOM_NO_POINTS: '{{room}} não tem pontos habilitados.',
			USER_NO_POINTS: '[[]]{{user}} não tem pontos na sala.',
			USER_POINTS: '[[]]{{user}} tem {{pointsList}} em {{roomName}}.',
			USER_POINTS_RANKED: '[[]]{{user}} está classificado #{{rank}} com {{pointsList}} em {{roomName}}.',
			ADDED_POINTS_TO_USERS: 'Adicionado {{pointsText}} para {{users}}.',
			HEADERS: {
				USER: 'Usuário',
			},
		},

		QUOTES: {
			NO_QUOTES_FOUND: 'Nenhuma citação encontrada.',
		},

		TIMER: {
			NONE_RUNNING: 'Você não tem um timer em execução!',
			ENDS_IN: 'Seu timer terminará em {{timeLeft}}{{comment}}.',
			WOULD_HAVE_ENDED_IN: '(O timer teria terminado em {{timeLeft}}.)',
			CANCELLED: 'Seu timer{{comment}} foi cancelado com {{timeLeft}} restantes.',
			MAX_TIME: 'Timers podem ser definidos por no máximo uma semana.',
			INVALID_TIME: 'Por favor, especifique um tempo para o timer! (Lembre-se de incluir unidades)',
			TIMER_END: '{{user}}, seu timer acabou!',
			TIMER_END_WITH_COMMENT: '{{user}}, seu timer acabou! Motivo: {{comment}}',
			TIMER_SET: 'Seu timer foi definido para {{timeLeft}} a partir de agora.',

			MS: {
				ABBR: 'ms',
				NAME: 'milissegundo',
				PLUR: 'milissegundos',
			},
			SEC: {
				ABBR: 'seg',
				NAME: 'segundo',
				PLUR: 'segundos',
			},
			MIN: {
				ABBR: 'min',
				NAME: 'minuto',
				PLUR: 'minutos',
			},
			HR: {
				ABBR: 'h',
				NAME: 'hora',
				PLUR: 'horas',
			},
			DAY: {
				ABBR: 'd',
				NAME: 'dia',
				PLUR: 'dias',
			},
			WK: {
				ABBR: 'sem',
				NAME: 'semana',
				PLUR: 'semanas',
			},
			YR: {
				ABBR: 'ano',
				NAME: 'ano',
				PLUR: 'anos',
			},
			DEC: {
				ABBR: 'déc',
				NAME: 'década',
				PLUR: 'décadas',
			},
		},
	},
} satisfies AvailableTranslations;
