const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
		this.service = await this.prompt([
			{
				type: 'input',
				name: 'name',
				message: 'Service name',
				default: this.packageJSONAnswers.name.match(/[\p{L}\p{N}]+/gu)?.map(n => n[0].toUpperCase() + n.slice(1)).join(''),
				validate: name => name.match(/^[\p{Lu}_][\p{L}\p{N}_]*$/u) ? true : 'The service name is invalid, please specify a name, starting with an uppercase letter or underscore, consisting only of letters, digits, and underscores.'
			},
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
