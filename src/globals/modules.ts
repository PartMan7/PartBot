/* eslint-disable no-var -- var needed for global stuff */

import type { Client as DiscordClient } from 'discord.js';
import type { Mongoose } from 'mongoose';
import type { Client as PSClient } from 'ps-client';

declare global {
	var PS: PSClient;
	var Discord: DiscordClient;
	var Database: Promise<Mongoose> | null;

	var __FIRST_RUN__: boolean;
}
