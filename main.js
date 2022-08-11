const yeoman = require('yeoman-environment')
const env = yeoman.createEnv()

env.register(require.resolve('./generators/jolie'), 'jolie:app')
env.run(['jolie:app', ...process.argv.slice(2)])
