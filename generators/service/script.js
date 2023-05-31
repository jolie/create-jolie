const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
		this.jot = opts.jot
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
	}

	configuring () {
		this.config.merge({
			service_data: {
				script: true,
				imports: [{
					module: 'console',
					symbols: [{
						target: 'Console'
					}]
				}],
				embeds: [
					'Console'
				],
				code: 'println@Console("Hello World!")()'
			}
		})
		this.packageJson.merge({
			main: this.module
		})
	}
}
