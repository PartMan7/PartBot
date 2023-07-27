import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

import 'config/env';

import 'global';

import PS from 'ps';
import Discord from 'discord';

global.PS = PS;
global.Discord = Discord;
