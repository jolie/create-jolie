const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module_name = opts.module.name
	}

	async prompting () {
		this.answers = await this.prompt([
			{ type: 'confirm', name: 'devcontainer', message: 'Do you want a devcontainer configuration for Visual Studio Code?', default: true },
			{ type: 'confirm', name: 'dockerfile', message: 'Do you want a Dockerfile?', default: true }
		])

		if (this.answers.dockerfile) {
			this.tcpPort = typeof (this.config.get('port')) !== 'undefined'
				? this.config.get('port')
				: await this.prompt({ type: 'input', name: 'tcpPort', message: 'Container listening port', default: '8080' })
		}
	}

	async writing () {
		if (this.answers.devcontainer) {
			this.copyTemplate(
				'devcontainer',
				'.devcontainer'
			)
		}

		if (this.answers.dockerfile) {
			this.renderTemplate(
				'Dockerfile',
				'Dockerfile',
				{
					moduleName: this.module_name,
					tcpPort: this.tcpPort
				}
			)
		}
	}
}
