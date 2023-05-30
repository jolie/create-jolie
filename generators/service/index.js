const Generator = require('yeoman-generator')
const debug = require('debug')('jolie-create:service')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		debug(opts)
		this.module = opts.module
		this.jot = opts.jot
	}

	async prompting () {
		this.answers = await this.prompt([
			{
				type: 'list',
				name: 'type',
				message: 'Choose type of the service',
				default: 'empty',
				choices: [
					{ name: 'empty service', value: 'empty' },
					{ name: 'script', value: 'script' }
				]
			},
			{ type: 'input', name: 'main_service', message: 'Name of main service', default: 'Main' }
		])
	}

	configuring () {
		this.service_data = {
			name: this.answers.main_service
		}
		if (this.answers.type === 'script') {
			this.service_data.script = true
			this.service_data.imports = [{
				module: 'console',
				symbols: [{
					target: 'Console'
				}]
			}]
			this.service_data.embeds = [
				'Console'
			]
			this.service_data.code = 'println@Console("Hello World!")()'
		} else {
			this.service_data.script = false
		}
		if (this.jot) {
			this.test_data = {
				module_name: this.module,
				service_name: this.answers.main_service
			}
			this.service_data.interfaces = [{
				name: 'Iface',
				rrs: [{
					name: 'hello',
					requestType: 'void',
					responseType: 'string'
				}],
				ows: []
			}]
			this.service_data.input_ports = [{
				name: 'IP',
				location: 'local',
				protocol: 'sodep',
				interfaces: 'Iface'
			}]
			this.execution = 'concurrent'
			this.service_data.code = `[hello()(res) {
            res = "World"
        }]`
		}
	}

	async writing () {
		if (this.jot) {
			this.renderTemplate('test', '.', this.test_data)
		}
		this.renderTemplate(
			'service/service.ol',
			this.module,
			this.service_data
		)
	}
}
