const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
	}

	async prompting () {
		this.answers = await this.prompt([
			{ type: 'confirm', name: 'webpack', message: 'Do you want to use webpack?' },
			{ type: 'confirm', name: 'mustache', message: 'Do you want to use Mustache templates?' },
			{ type: 'input', name: 'tcpPort', message: 'TCP port for receiving HTTP requests', default: '8080' }
		])
		this.config.set('port', this.answers.tcpPort)
	}

	async configuring () {
		if (this.answers.webpack) {
			this.packageJson.merge({
				scripts: { build: 'webpack' }
			})
			await this.addDevDependencies({ 'webpack-cli': '^4', webpack: '^5' })
		}
		this.packageJson.merge({
			scripts: {
				start: `jolie ${this.module}`
			}
		})
	}

	async writing () {
		const pathToTemplate = this.answers.mustache ? 'webapp-mustache' : 'webapp'
		this.renderTemplate(
			`${pathToTemplate}/main.ol`,
			this.module,
			{ tcpPort: this.answers.tcpPort }
		)
		this.renderTemplate(`${pathToTemplate}/web`, 'web', {
			webpack: this.answers.webpack,
			tcpPort: this.answers.tcpPort
		})

		if (this.answers.mustache) {
			this.copyTemplate('webapp-mustache/templates', 'templates')
		}

		if (this.answers.webpack) {
			this.copyTemplate('webapp-webpack-addons', '.')
		}
	}

	async install () {
		this.spawnCommandSync('jpm', ['install', '@jolie/leonardo'])
	}
}
