const Generator = require('yeoman-generator')

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.module = opts.module
	}

	async configuring () {
		this.packageJson.merge({
			main: this.module,
			scripts: {
				start: `jolie ${this.module}`
			}
		})
	}

	async writing () {
		this.copyTemplate(
			'main.ol',
			this.module
		)
	}
}
