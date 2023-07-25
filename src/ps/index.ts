import { Client as PSClient } from '../../../PSC';
import { username, password, rooms } from 'config/ps';

const PS = new PSClient({ username, password, rooms });
PS.connect();
PS.on('login', () => console.log('Connected!'));

export default PS;
