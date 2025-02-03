#!/usr/bin/env node
import { createEnv } from 'yeoman-environment'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const env = createEnv()

env.lookup().then(() => {
	env.register(require.resolve('./generators/app'), 'jolie:app')
	return env.run('jolie:app', { skipInstall: true, ...process.argv.slice(2) })
}).catch((e) => { console.error('Error running jolie generator', e) })
