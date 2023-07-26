import { Client as PSClient } from 'ps-client';
import { username, password, rooms } from 'config/ps';

const PS = new PSClient({ username, password, rooms });
PS.connect();
PS.on('login', () => console.log('Connected to PS!'));

// const chatHandler: (message: )

export default PS;
