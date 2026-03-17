import React from 'react';
import { render } from 'ink';
import { MainMenu } from './components/MainMenu.js';

const fileMode = process.argv.includes('--file');
render(<MainMenu fileMode={fileMode} />);
