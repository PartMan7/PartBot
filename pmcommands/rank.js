module.exports = {
	help: `Displays user's rank on leadboard for the given room. Syntax: ${prefix}rank (room), (username [optional])`,
	permissions: 'none',
	commandFunction: function (Bot, by, args, client) {
		const byId = toID(by);
		if (!args.length) {
			args = Object.keys(Bot.rooms).filter(room => Bot.rooms[room].users.find((u) => toID(u) === byId) && Bot.rooms[room].lb);
			if (args.length !== 1) return Bot.pm(by, 'Which room?');
		}
		const cargs = args.join('').split(',');
		const room = tools.getRoom(cargs.shift());
		if (!room) return Bot.pm(by, 'Which room?');
		if (!Bot.rooms[room]) return Bot.pm(by, "I'm not in that room! (does it even exist?)");
		const lb = Bot.rooms[room].lb;
		if (!lb) return Bot.pm(by, 'Nope, no leaderboard there.');
		const data = Object.entries(lb.users).toSorted((a, b) => b[1].points[0] - a[1].points[0]);
		if (!data.length) return Bot.pm(by, 'Empty board. o.o');
		const target = toID(cargs[0]) || byId;
		const rank = data.findIndex((entry) => entry[0] === target);
		if (rank === -1) return Bot.pm(by, `${target} not found on the ${Bot.rooms[room].title} room leaderboard.`);
		const entry = data[rank][1];
		return Bot.pm(by, `${entry.name} is ranked #${rank + 1} with ${entry.points[0]} points on the ${Bot.rooms[room].title} room leaderboard.`);
	}
};

