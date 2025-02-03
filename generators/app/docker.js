import Generator from 'yeoman-generator'

export default class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.jolieVersion = opts.jolieVersion
	}

	async prompting () {
		this.answers = await this.prompt([
			{ type: 'confirm', name: 'devcontainer', message: 'Do you want a devcontainer configuration for Visual Studio Code?', default: true },
			{ type: 'confirm', name: 'dockerfile', message: 'Do you want a Dockerfile?', default: true }
		])

		if (this.answers.dockerfile && typeof (this.config.get('port')) === 'undefined') {
			this.tcpPort = typeof (this.config.get('port')) !== 'undefined'
				? this.config.get('port')
				: await this.prompt({
					type: 'input',
					name: 'tcpPort',
					message: 'Container listening port',
					default: '8080',
					validate: port => {
						const p = Number(port)
						if (isNaN(p)) { return 'Container listening port must be an integer' }
						if (p < 0 || p > 65535) { return 'Container listening port must be in the range: [0,65535]' }
						return true
					}
				}).then(answer => answer.tcpPort)
		}
	}

	async writing () {
		if (this.answers.devcontainer) {
			this.config.defaults({ extensions: [] })
			this.renderTemplate(
				'devcontainer',
				'.devcontainer',
				{
					version: this.jolieVersion,
					extensions: ['jolie.vscode-jolie', ...this.config.get('extensions')]
				}
			)
		}

		if (this.answers.dockerfile) {
			this.renderTemplate(
				'Dockerfile',
				'Dockerfile',
				{
					version: this.jolieVersion,
					tcpPort: this.tcpPort
				}
			)
		}
	}
}
