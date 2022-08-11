const Generator = require('yeoman-generator')
const debug = require('debug')('jolie-create')

module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor (args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts)

    this.argument('packagename', { type: String, required: false })
    debug('options: ', this.options)
  }

  initializing () {
    this.log('Start creating a Jolie project.')
  }

  async prompting () {
    this.answers = await this.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'package name'
      },
      {
        type: 'input',
        name: 'version'
      },
      { type: 'input', name: 'description' },
      { type: 'input', name: 'main', message: 'entry point' },
      { type: 'input', name: 'test', message: 'test command' },
      { type: 'input', name: 'repo', message: 'git repository' },
      { type: 'input', name: 'keywords', message: 'keywords (space-delimited)' },
      { type: 'input', name: 'author' },
      { type: 'input', name: 'license' },
      {
        type: 'confirm',
        name: 'java',
        message: 'Will you write JavaService as part of this project?'
      }
    ])
    debug(this.answers)
  }

  configuring () {

  }

  writing () {
    this.composeWith(require.resolve('generator-npm-init/app'), {
      'skip-name': true,
      'skip-description': true,
      'skip-version': true,
      'skip-main': true,
      'skip-repo': true,
      'skip-keywords': true,
      'skip-author': true,
      'skip-license': true,
      name: this.answers.name,
      description: this.answers.description,
      version: this.answers.version,
      main: this.answers.main,
      repo: this.answers.repo,
      keywords: this.answers.keywords,
      author: this.answers.author,
      license: this.answers.license
    })
  }

  install () {
    this.spawnCommand('npx', ['@jolie/jpm', 'init'])
  }

  end () {
    this.log('A Jolie project is initialized.')
  }
}
