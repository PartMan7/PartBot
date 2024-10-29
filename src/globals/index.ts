import '@/globals/prototypes';

import axios from 'axios';
import fsSync from 'fs';
import path from 'path';
import React from 'react';

import * as Tools from '@/tools';
import { fsPath } from '@/utils/fs-path';
import { log } from '@/utils/logger';
import { ChatError } from '@/utils/chat-error';

import { jsxToHTML } from '@/utils/jsx-to-html';

global.axios = axios;
global.fs = fsSync.promises;
global.fsSync = fsSync;
global.path = path;
global.React = React;

global.Tools = Tools;

global.fsPath = fsPath;
global.log = log;
global.ChatError = ChatError;

global.jsxToHTML = jsxToHTML;
