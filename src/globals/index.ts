import axios from 'axios';
import * as fsSync from 'fs';
import * as path from 'path';
import React from 'react';
global.axios = axios;
global.fs = fsSync.promises;
global.fsSync = fsSync;
global.path = path;
global.React = React;

import * as Tools from '@/tools';
global.Tools = Tools;

import fsPath from '@/utils/fs-path';
global.fsPath = fsPath;
import { log } from '@/utils/logger';
global.log = log;
import { jsxToHTML } from '@/utils/jsx-to-html';
global.jsxToHTML = jsxToHTML;

import ChatError from '@/utils/chat-error';
global.ChatError = ChatError;
