const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.service_name = opts.service_name
		this.module = opts.module
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
		const checkVersion = version => {
			const v = Number(version)
			if (isNaN(v)) { return 'The Java version must be a number' }
			if (v < 21) { return 'The Java version must at least be 21' }
			return true
		}
		this.answers = await this.prompt([
			{ type: 'input', name: 'groupId', message: 'groupId', default: `joliex.${this.packageJSONAnswers.name.toLowerCase()}` },
			{ type: 'input', name: 'artifactId', message: 'artifactId', default: this.service_name.toLowerCase() },
			{ type: 'input', name: 'javaVersion', message: 'Java version', default: '21', validate: checkVersion },
			{ type: 'confirm', name: 'standalone', message: 'Do you want a launcher service (standalone service)?', default: false }
		])
	}

	async configuring () {
		const interfaces = []
		const services = []

		if (this.answers.standalone) {
			const launcherName = `${this.service_name}Launcher`
			services.push({
				name: launcherName,
				embeds: [this.service_name],
				input_ports: [{
					name: `${this.service_name}Input`,
					location: 'socket://localhost:8080',
					protocol: 'http { format = "json" }',
					aggregates: [this.service_name]
				}],
				code: 'linkIn( Shutdown )'
			})

			this.packageJson.merge({
				scripts: {
					prestart: 'mvn package',
					start: `jolie --service ${launcherName} ${this.module}`
				}
			})
		}

		const packageName = this.answers.groupId
		const interfaceName = `${this.service_name}Interface`

		interfaces.push({
			name: interfaceName,
			rrs: [{
				name: 'hello',
				requestType: 'void',
				responseType: 'string'
			}]
		})

		services.push({
			name: this.service_name,
			input_ports: [{
				name: 'ip',
				location: 'local',
				interfaces: [interfaceName]
			}],
			foreign: {
				type: 'java',
				class: `${packageName}.${this.service_name}`
			}
		})

		this.config.merge({
			jolie_file: {
				interfaces,
				services
			}
		})

		this.packageJson.merge({
			scripts: {
				'clean-generate': 'rimraf -g "./src/main/java/*" && npm run generate',
				generate: `jolie2java --outputDirectory "./src/main/java" --packageName "${packageName}" --typePackage "${packageName}.spec.types" --faultPackage "${packageName}.spec.faults" --interfacePackage "${packageName}.spec.interfaces" --serviceName "${this.service_name}" --generateService 0 ${this.module}`
			}
		})

		await this.addDevDependencies({ rimraf: '^5' })
	}

	async writing () {
		this.renderTemplate(
			'java/pom.xml',
			'pom.xml',
			{
				groupId: this.answers.groupId,
				artifactId: this.answers.artifactId,
				version: this.packageJSONAnswers.version,
				name: this.packageJSONAnswers.name,
				url: this.packageJSONAnswers.repo,
				javaVersion: this.answers.javaVersion
			}
		)
	}

	async install () {
		this.spawnCommandSync('npm', ['run', 'generate'])
	}
}
