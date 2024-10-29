import '@/globals';

import PS from '@/ps';
import Discord from '@/discord';
import Web from '@/web';
import { connect } from '@/database';
import '@/sentinel';

global.PS = PS;
global.Discord = Discord;
global.Web = Web;

connect().then(() => log('Connected to the database!'));
