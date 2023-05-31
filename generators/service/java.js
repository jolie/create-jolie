const Generator = require('yeoman-generator')
const path = require('path')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
		this.jot = opts.jot
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
		const lowerCaseName = this.packageJSONAnswers.name.toLowerCase()
		const pascalCaseName = this.packageJSONAnswers.name.replace(/\w+/g, function (w) { return w[0].toUpperCase() + w.slice(1).toLowerCase() })
		this.answers = await this.prompt([
			{ type: 'input', name: 'groupId', message: 'groupId', default: `joliex.${lowerCaseName}` },
			{ type: 'input', name: 'artifactId', message: 'artifactId', default: lowerCaseName },
			{ type: 'input', name: 'javaClassName', message: 'java class name', default: pascalCaseName },
			{ type: 'input', name: 'javaSourceVersion', message: 'java source version', default: '11' }
		])
	}

	configuring () {
		this.package = this.answers.groupId
		this.classPath = `${this.package}.${this.answers.javaClassName}`
		this.classPathInSystem = path.join('src', 'main', 'java', ...this.classPath.split('.'))
		this.config.merge({
			service_data: {
				foreign: {
					type: 'java',
					class: this.classPath
				},
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
					interfaces: 'Iface'
				}]
			}
		})
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
				javaSourceVersion: this.answers.javaSourceVersion
			}
		)

		this.renderTemplate(
			'java/javaservice.java',
			this.classPathInSystem + '.java',
			{
				package: this.package,
				className: this.answers.javaClassName
			}
		)
	}

	end () {

	}
}
