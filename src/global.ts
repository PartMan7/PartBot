import axios from 'axios';
import * as fsSync from 'fs';
import * as path from 'path';
global.axios = axios;
global.fs = fsSync.promises;
global.fsSync = fsSync;
global.path = path;

import * as Tools from 'tools';
global.Tools = Tools;

import fsPath from 'utils/fs-path';
global.fsPath = fsPath;
