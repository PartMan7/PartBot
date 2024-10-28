import '@/globals';

import PS from '@/ps';
import Discord from '@/discord';
import Web from '@/web';

global.PS = PS;
global.Discord = Discord;
global.Web = Web;

import { connect } from '@/database';
connect().then(() => log('Connected to the database!'));

import { emitter } from '@/sentinel';

export default emitter;
