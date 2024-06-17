const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
		const pascalCaseName = this.packageJSONAnswers.name.replace(/\w+/g, function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase() })
		this.service = await this.prompt([
			{ type: 'input', name: 'name', message: 'Service name', default: pascalCaseName },
			{
				type: 'list',
				name: 'language',
				message: 'Implementation language',
				choices: [
					{ name: 'Jolie', value: 'jolie' },
					{ name: 'Java (requires Jolie >= 1.13)', value: 'java' }
				]
			}
		])

		this.composeWith(require.resolve(`./${this.service.language}`), { service_name: this.service.name, module: this.module, packageJSONAnswers: this.packageJSONAnswers })
		this.composeWith(require.resolve('./dev'), { service: this.service, module: this.module })
	}

	async writing () {
		const jolieFile = typeof (this.config.get('jolie_file')) !== 'undefined'
			? this.config.get('jolie_file')
			: { services: [{ name: this.service.name }] }

		this.renderTemplate(
			'service/service.ol',
			this.module,
			{ file: jolieFile }
		)
	}
}
