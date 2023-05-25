const Generator = require('yeoman-generator')
const path = require('path')
const semver = require('semver')
const os = require('os')
const debug = require('debug')('jolie-create')

const Templates = {
	SERVICE: {
		value: 'Jolie Service',
		generator: require.resolve('../service')
	},
	SCRIPT: {
		value: 'Jolie script',
		prompts: [
			{ type: 'input', name: 'mainServiceName', message: 'Name of main service', default: 'Main' }
		],
		scaffold: gen => {
			gen.renderTemplate(
				'script/main.ol',
				gen.answers.main,
				{ Main: gen.templateAnswers.mainServiceName }
			)
		}
	},
	WEB_APP: {
		value: 'Web application (simple)',
		prompts: [
			{ type: 'confirm', name: 'webpack', message: 'Do you want to use webpack?' },
			{ type: 'input', name: 'tcpPort', message: 'TCP port for receiving HTTP requests', default: '8080' }
		],
		scaffold: gen => {
			gen.renderTemplate(
				'webapp/main.ol',
				gen.answers.main,
				{ tcpPort: gen.templateAnswers.tcpPort }
			)
			gen.renderTemplate('webapp/web', 'web', {
				webpack: gen.templateAnswers.webpack,
				tcpPort: gen.templateAnswers.tcpPort
			})
			if (gen.templateAnswers.webpack) {
				gen.copyTemplate('webapp-webpack-addons', '.')
			}
		},
		configure: gen => {
			if (gen.templateAnswers.webpack) {
				gen.packageJson.merge({
					scripts: { build: 'webpack' }
				})
				gen.addDevDependencies({ 'webpack-cli': '^4', webpack: '^5' })
			}
		},
		install: gen => {
			gen.spawnCommandSync('npx', ['@jolie/jpm', 'install', '@jolie/leonardo'])
		}
	},
	WEB_APP_MUSTACHE: {
		value: 'Web application (with Mustache templating)',
		prompts: [
			{ type: 'confirm', name: 'webpack', message: 'Do you want to use webpack?' },
			{ type: 'input', name: 'tcpPort', message: 'TCP port for receiving HTTP requests', default: '8080' }
		],
		scaffold: gen => {
			gen.renderTemplate(
				'webapp-mustache/main.ol',
				gen.answers.main,
				{ tcpPort: gen.templateAnswers.tcpPort }
			)
			gen.renderTemplate('webapp-mustache/web', 'web', {
				webpack: gen.templateAnswers.webpack,
				tcpPort: gen.templateAnswers.tcpPort
			})
			gen.copyTemplate('webapp-mustache/templates', 'templates')
			if (gen.templateAnswers.webpack) {
				gen.copyTemplate('webapp-webpack-addons', '.')
			}
		},
		configure: gen => {
			if (gen.templateAnswers.webpack) {
				gen.packageJson.merge({
					scripts: { build: 'webpack' }
				})
				gen.addDevDependencies({ 'webpack-cli': '^4', webpack: '^5' })
			}
		},
		install: gen => {
			gen.spawnCommandSync('npx', ['@jolie/jpm', 'install', '@jolie/leonardo'])
		}
	}
}

module.exports = class extends Generator {
	// The name `constructor` is important here
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
		const { moduleName } = await this.prompt({ type: 'input', name: 'moduleName', message: 'Module file name', default: 'main.ol' })
		debug('answers', this.packageJSONAnswers)
		debug('moduleName', moduleName)

		this.projectTemplate = await this.prompt([
			{
				type: 'list',
				name: 'template',
				message: 'project template',
				choices: Object.entries(Templates).map(([_, template]) => {
					return { name: template.value, value: template }
				})
			}
		])

		this.jot = await this.prompt({
			type: 'confirm',
			name: 'jot',
			message: 'Do you want to use jot testing suit?',
			default: true
		})

		this.composeWith(this.projectTemplate.template.generator, { jot: this.jot, module: moduleName })

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
			this.composeWith(require.resolve('../dockerfile'), { module: moduleName })
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
		this.packageJSONAnswers.scripts = {}
		if (this.watch) {
			this.packageJSONAnswers.scripts.watch = `nodemon jolie ${this.packageJSONAnswers.main}`
		}
		if (this.jot) {
			this.packageJSONAnswers.scripts.test = 'jot jot.json'
		}
		this.packageJson.merge(this.packageJSONAnswers)
	}

	async writing () {
		debug('writing')
		// if (this.answers.template.scaffold) {
		// 	this.answers.template.scaffold(this)
		// }
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
		// this.fs.writeJSON(this.destinationPath('package.json'), this.packageJSONAnswers)
	}

	end () {
		debug('end')
		// this.fs.extendJSON(this.destinationPath('package.json'), this.packageJSONAnswers)
		this.spawnCommandSync('npx', ['@jolie/jpm', 'init'])

		// if (this.answers.template.install) {
		// 	this.answers.template.install(this)
		// }
		this.log('Jolie project initialised')
	}
}
