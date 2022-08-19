const Generator = require('yeoman-generator')
const path = require('path')
const semver = require('semver')
const os = require('os')
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
        message: 'package name',
        default: path.basename(process.cwd())
      },
      {
        type: 'input',
        name: 'version',
        default: '0.0.0',
        validate (ip) {
          console.log(ip)
          return semver.valid(ip) !== null
        }
      },
      { type: 'input', name: 'description' },
      { type: 'input', name: 'main', message: 'entry point', default: 'main.ol' },
      { type: 'input', name: 'test', message: 'test command', default: 'echo "Error: no test specified" && exit 1' },
      { type: 'input', name: 'repo', message: 'git repository' },
      { type: 'input', name: 'keywords', message: 'keywords (space-delimited)' },
      { type: 'input', name: 'author', default: os.userInfo().username },
      { type: 'input', name: 'license', default: 'ISC' },
      {
        type: 'confirm',
        name: 'live',
        message: 'Do you want to include automatic restart script?',
        default: true
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
      'skip-test': true,
      name: this.answers.name,
      description: this.answers.description,
      version: this.answers.version,
      main: this.answers.main,
      repo: this.answers.repo,
      keywords: this.answers.keywords ? this.answers.keywords : [],
      author: this.answers.author,
      license: this.answers.license,
      test: this.answers.test,
      scripts: this.answers.live
        ? {
            watch: `nodemon jolie ${this.answers.main}`
          }
        : null
    })
  }

  install () {
    this.spawnCommandSync('npx', ['@jolie/jpm', 'init'])
    if (this.answers.live) {
      this.spawnCommandSync('npm', ['install', '-D', 'nodemon'])
    }
  }

  end () {
    this.log('A Jolie project is initialised.')
  }
}
