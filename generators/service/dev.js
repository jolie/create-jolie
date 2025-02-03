import Generator from 'yeoman-generator'
import latestVersion from 'latest-version';

export default class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.service = opts.service
		this.module = opts.module
	}

	async prompting () {
		this.answers = await this.prompt({ type: 'confirm', name: 'useJot', message: 'Do you want to use the Jot testing suite?', default: true })
	}

	async configuring () {
		if (this.answers.useJot) {
			if (this.service.language === 'java') {
				this.packageJson.merge({
					scripts: {
						pretest: 'mvn package'
					}
				})
			}

			if (this.service.language === 'jolie') {
				const interfaceName = `${this.service.name}Interface`
				this.config.set('file', {
					interfaces: [{
						name: interfaceName,
						rrs: [{
							name: 'hello',
							requestType: 'void',
							responseType: 'string'
						}],
						ows: []
					}],
					services: [{
						name: this.service.name,
						execution: 'concurrent',
						input_ports: [{
							name: 'ip',
							location: 'local',
							protocol: 'sodep',
							interfaces: [interfaceName]
						}],
						code: '[hello()(res) { res = "World" }]'
					}]
				})
			}

			this.packageJson.merge({
				scripts: {
					test: 'jot jot.json'
				}
			})
			const jotVersion = await latestVersion('@jolie/jot')
			await this.addDevDependencies({ '@jolie/jot': `^${jotVersion}` })
		}
	}

	async writing () {
		if (this.answers.useJot) {
			this.renderTemplate(
				'jot',
				'.',
				{ module_name: this.module, service_name: this.service.name }
			)
		}
	}
}
