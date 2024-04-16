const Generator = require('yeoman-generator')
const debug = require('debug')('jolie-create:docker')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
	}

	async prompting () {
		const configuredPort = this.config.get('port')
		if (configuredPort) {
			this.answers = { tcpPort: configuredPort }
		} else {
			this.answers = await this.prompt([
				{ type: 'input', name: 'tcpPort', message: 'Container listening port', default: '8080' }
			])
		}
	}

	configuring () {

	}

	async writing () {
		this.renderTemplate(
			'Dockerfile',
			'Dockerfile',
			{
				moduleName: this.module.name,
				tcpPort: this.answers.tcpPort ? this.answers.tcpPort : undefined
			}
		)
	}
}
