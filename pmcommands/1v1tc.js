module.exports = {
	help: `Recreates the 1v1TC GC.`,
	noDisplay: true,
	permissions: 'none',
	commandFunction: function (Bot, by, args, client) {
		if (Bot.rooms[tcroom]) return Bot.say(tcroom, `/invite ${by}`);
		if (!Bot.baseAuth[tcroom][toID(by)] || Bot.baseAuth[tcroom][toID(by)] < 4) return Bot.pm(by, 'Access denied.');
		Bot.say('botdevelopment', '/makegroupchat 1v1TC');
		Bot.say(tcroom, `/invite ${by}`);
		const typeChan = client.channels.cache.get('542524011066949633');
		typeChan.send(`${by.substr(1)} brought the GC online! https://play.pokemonshowdown.com/groupchat-partbot-1v1tc`);
		const invitees = [].concat(...Object.keys(Bot.baseAuth[tcroom]));
		if (Bot.tcInvitees) invitees.concat(Bot.tcInvitees);
		function inviteTimer (i) {
			if (i >= invitees.length) return;
			Bot.say(tcroom, `/forceroomvoice ${invitees[i]}\n/invite ${invitees[i]}`);
			setTimeout(inviteTimer, 1000, i + 1);
		}
		inviteTimer(0);
		return Bot.say(tcroom, 'UwU');
	}
};
