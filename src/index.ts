import * as dotenv from 'dotenv';
dotenv.config();

import 'config/env';

import 'globals';

import PS from 'ps';
import Discord from 'discord';
import Web from 'web';

global.PS = PS;
global.Discord = Discord;
global.Web = Web;

import * as DB from 'database';
DB.connect().then(() => log('Connected to the database!'));

import { emitter } from 'sentinel';

export default emitter;
