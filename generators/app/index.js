const Generator = require('yeoman-generator')
const path = require('path')
const semver = require('semver')
const os = require('os')
const debug = require('debug')('jolie-create')

const Templates = {
	SERVICE: {
		label: 'Jolie Service',
		value: 'service',
		generator: require.resolve('../service')
	},
	WEB_APP: {
		label: 'Web application',
		value: 'webapp',
		generator: require.resolve('../web')
	}
}

module.exports = class extends Generator {
	constructor (args, opts) {
		// Calling the super constructor is important so our generator is correctly set up
		super(args, opts)
		this.env.options.nodePackageManager = 'npm'
	}

	initializing () {
		this.log('Start creating a Jolie project.')
	}

	async prompting () {
		this.packageJSONAnswers = await this.prompt([
			{
				type: 'input',
				name: 'name',
				message: 'Package name',
				default: path.basename(process.cwd())
			},
			{
				type: 'input',
				name: 'version',
				message: 'Version',
				default: '0.0.0',
				validate (version) {
					if (semver.valid(version) === null) {
						return 'The version is invalid, please specify a valid Semantic Versioning'
					} else {
						return true
					}
				}
			},
			{ type: 'input', name: 'description', message: 'Package description' },
			{ type: 'input', name: 'repo', message: 'Git repository URL' },
			{ type: 'input', name: 'keywords', message: 'Package keywords (comma-delimited)', default: '' },
			{ type: 'input', name: 'author', message: 'Author', default: os.userInfo().username },
			{ type: 'input', name: 'license', message: 'License', default: 'ISC' }
		])
		this.module = await this.prompt({ type: 'input', name: 'name', message: 'Module file name', default: 'main.ol' })
		debug('moduleName', this.module.name)

		this.projectTemplate = await this.prompt([
			{
				type: 'list',
				name: 'template',
				message: 'project template',
				choices: Object.entries(Templates).map(([_, template]) => {
					return { name: template.label, value: template }
				})
			}
		])

		if (this.projectTemplate.template.value === 'service') {
			this.jot = await this.prompt({
				type: 'confirm',
				name: 'jot',
				message: 'Do you want to use jot testing suit?',
				default: true
			})
		}

		this.composeWith(this.projectTemplate.template.generator, { jot: this.jot, module: this.module.name })

		this.watch = await this.prompt({
			type: 'confirm',
			name: 'watch',
			message: 'Do you want to a "watch" script for live development (hot reload)?',
			default: true
		})
		const { dockerfile } = await this.prompt({
			type: 'confirm',
			name: 'dockerfile',
			message: 'Do you want a Dockerfile?',
			default: true
		})
		if (dockerfile) {
			this.composeWith(require.resolve('../dockerfile'), { module: this.module.name })
		}
		this.devcontainer = await this.prompt({
			type: 'confirm',
			name: 'devcontainer',
			message: 'Do you want a devcontainer configuration for Visual Studio Code?',
			default: true
		})
	}

	configuring () {
		this.packageJSONAnswers.keywords = this.packageJSONAnswers.keywords === '' ? [] : this.packageJSONAnswers.keywords.split(',')
		this.packageJSONAnswers.scripts = {
			start: `jolie ${this.module.name}`
		}
		if (this.watch) {
			this.packageJSONAnswers.scripts.watch = `nodemon jolie ${this.module.name}`
		}
		if (this.jot) {
			this.packageJSONAnswers.scripts.test = 'jot jot.json'
		}
		this.packageJson.merge(this.packageJSONAnswers)
	}

	async writing () {
		debug('writing')
		if (this.watch) {
			await this.addDevDependencies('nodemon')
		}
		if (this.jot) {
			await this.addDevDependencies('@jolie/jot')
		}

		// devcontainer config
		if (this.devcontainer) {
			this.copyTemplate(
				'devcontainer',
				'.devcontainer'
			)
		}
	}

	install () {
		debug('install')
		this.spawnCommandSync('npx', ['@jolie/jpm', 'init'])
	}

	end () {
		debug('end')
		this.fs.delete('.yo-rc.json')
		this.log('Jolie project initialised')
	}
}
