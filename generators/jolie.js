const Generator = require('yeoman-generator')
const jpmInit = require('./jpm')
const debug = require('debug')('jolie-create')

module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor (args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts)

    this.argument('packagename', { type: String, required: false })
    debug('options: ', this.options)
    this.composeWith(require.resolve('generator-npm-init/app'), { name: this.options.packagename })
    this.composeWith({ Generator: jpmInit, path: require.resolve('./jpm') }
      , { name: this.options.packagename })
  }

  initializing () {
    this.log('Start creating a Jolie project.')
  }

  prompting () {

  }

  configuring () {

  }

  writing () {
  }

  end () {
    this.log('A Jolie project is initialized.')
  }
}
