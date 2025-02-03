import Generator from 'yeoman-generator'
import latestVersion from 'latest-version'

export default class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.service_name = opts.service_name
		this.module = opts.module
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
		this.answers = await this.prompt({ type: 'confirm', name: 'watch', message: 'Do you want a "watch" script for live development (hot reload)?', default: true })
	}

	async configuring () {
		if (this.answers.watch) {
			this.packageJson.merge({
				scripts: {
					watch: `nodemon --exec jolie ${this.module}`
				}
			})
			const nodemonVersion = await latestVersion('nodemon')
			await this.addDevDependencies({ nodemon: `^${nodemonVersion}` })
		}

		this.packageJson.merge({
			scripts: {
				start: `jolie ${this.module}`
			}
		})
	}
}
