#!/usr/bin/env node
const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()

env.register(require.resolve('./generators/app'), 'jolie:app')
env.run(['jolie:app', { 'skip-install': true }, ...process.argv.slice(2)])
