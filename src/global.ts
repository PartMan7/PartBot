import axios from 'axios';
import { promises as fs } from 'fs';
global.axios = axios;
global.fs = fs;


import * as Tools from 'tools';
global.Tools = Tools;
