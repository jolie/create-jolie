#!/usr/bin/env node
const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()

env.register(require.resolve('./generators/app'), 'jolie:app')
env.run('jolie:app', { skipInstall: true, ...process.argv.slice(2) }).then(() => {}).catch((e)=>console.error(e))
