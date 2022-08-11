const Generator = require('yeoman-generator')
// const shell = require('shelljs')

module.exports = class extends Generator {
  writing () {
    // shell.exec('npx @jolie/jpm init')
  }

  install () {
    this.spawnCommand('npx', ['@jolie/jpm', 'init'])
  }
}
