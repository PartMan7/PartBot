import * as dotenv from 'dotenv';
dotenv.config();

import 'config/env';

import 'globals';

import PS from 'ps';
import Discord from 'discord';

global.PS = PS;
global.Discord = Discord;
