const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
		this.answers = await this.prompt([
			{ type: 'input', name: 'main_service', message: 'Name of main service', default: 'Main' },
			{
				type: 'list',
				name: 'type',
				message: 'Choose type of the service',
				default: 'empty',
				choices: [
					// { name: 'empty service', value: 'empty' },
					// { name: 'script', value: 'script' },
					{ name: 'java service', value: 'java' }
				]
			}
		])

		this.watchAnswer = await this.prompt({
			type: 'confirm',
			name: 'watch',
			message: 'Do you want to a "watch" script for live development (hot reload)?',
			default: true
		})

		this.jotAnswer = await this.prompt({
			type: 'confirm',
			name: 'useJot',
			message: 'Do you want to use jot testing suit?',
			default: true
		})

		if (this.answers.type !== 'empty') {
			this.composeWith(require.resolve(`./${this.answers.type}`), { module: this.module, main_service: this.answers.main_service, packageJSONAnswers: this.packageJSONAnswers })
		}
	}

	async configuring () {
		this.config.merge({
			service_data: {
				name: this.answers.main_service
			}
		})

		if (this.answers.type === 'empty' && this.jotAnswer.useJot) {
			this.config.merge({
				service_data: {
					interfaces: [{
						name: 'Iface',
						rrs: [{
							name: 'hello',
							requestType: 'void',
							responseType: 'string'
						}],
						ows: []
					}],
					input_ports: [{
						name: 'IP',
						location: 'local',
						protocol: 'sodep',
						interfaces: 'Iface'
					}],
					execution: 'concurrent',
					code: `[hello()(res) {
            res = "World"
        }]`
				}
			})
		}

		if (this.answers.type === 'empty' || this.answers.type === 'script') {
			this.packageJson.merge({
				scripts: {
					start: `jolie ${this.module.name}`
				}
			})
		}

		if (this.jotAnswer.useJot) {
			this.test_data = {
				module_name: this.module,
				service_name: this.answers.main_service
			}

			this.packageJson.merge({
				scripts: {
					test: 'jot jot.json'
				}
			})
			await this.addDevDependencies('@jolie/jot')
		}

		if (this.watchAnswer.watch) {
			this.packageJson.merge({
				scripts: {
					watch: `nodemon jolie ${this.module}`
				}
			})
			await this.addDevDependencies('nodemon')
		}
	}

	async writing () {
		if (this.jotAnswer.useJot) {
			this.renderTemplate('test', '.', this.test_data)
		}

		this.renderTemplate(
			'service/service.ol',
			this.module,
			this.config.get('service_data')
		)
	}
}
