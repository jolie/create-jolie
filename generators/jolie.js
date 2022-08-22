const Generator = require('yeoman-generator')
const path = require('path')
const semver = require('semver')
const os = require('os')
const debug = require('debug')('jolie-create')

const Templates = {
	EMPTY: {
		value: 'Empty Jolie project',
		prompts: [
			{ type: 'input', name: 'mainServiceName', message: 'Name of main service', default: 'Main' }
		],
		scaffold: async gen => {
			gen.renderTemplate(
				'empty/main.ol',
				'main.ol',
				{ Main: gen.templateAnswers.mainServiceName }
			)
		}
	},
	SCRIPT: {
		value: 'Jolie script',
		prompts: [
			{ type: 'input', name: 'mainServiceName', message: 'Name of main service', default: 'Main' }
		],
		scaffold: async gen => {
			gen.renderTemplate(
				'script/main.ol',
				'main.ol',
				{ Main: gen.templateAnswers.mainServiceName }
			)
		}
	},
	WEB_APP: {
		value: 'Web application (simple)',
		prompts: [
			{ type: 'input', name: 'tcpPort', message: 'TCP port for receiving HTTP requests', default: '8080' }
		],
		scaffold: async gen => {
			gen.renderTemplate(
				'webapp/main.ol',
				'main.ol',
				{ tcpPort: gen.templateAnswers.tcpPort }
			)
			gen.copyTemplate('webapp/web', 'web')
		},
		install: gen => {
			gen.spawnCommandSync('npx', ['@jolie/jpm', 'install', '@jolie/leonardo'])
		}
	},
	WEB_APP_MUSTACHE: {
		value: 'Web application (with Mustache templating)',
		prompts: [
			{ type: 'input', name: 'tcpPort', message: 'TCP port for receiving HTTP requests', default: '8080' }
		],
		scaffold: async gen => {
			gen.renderTemplate(
				'webapp-mustache/main.ol',
				'main.ol',
				{ tcpPort: gen.templateAnswers.tcpPort }
			)
			gen.copyTemplate('webapp-mustache/web', 'web')
			gen.copyTemplate('webapp-mustache/templates', 'templates')
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

		this.argument('packagename', { type: String, required: false })
		debug('options: ', this.options)
	}

	initializing () {
		this.log('Start creating a Jolie project.')
	}

	async prompting () {
		this.answers = await this.prompt([
			{
				type: 'input',
				name: 'name',
				message: 'package name',
				default: path.basename(process.cwd())
			},
			{
				type: 'input',
				name: 'version',
				default: '0.1.0',
				validate (ip) {
					console.log(ip)
					return semver.valid(ip) !== null
				}
			},
			{ type: 'input', name: 'description' },
			{ type: 'input', name: 'main', message: 'entry point', default: 'main.ol' },
			{ type: 'input', name: 'test', message: 'test command', default: 'echo "Error: no test specified" && exit 1' },
			{ type: 'input', name: 'repo', message: 'git repository' },
			{ type: 'input', name: 'keywords', message: 'keywords (space-delimited)', default: '' },
			{ type: 'input', name: 'author', default: os.userInfo().username },
			{ type: 'input', name: 'license', default: 'ISC' },
			{
				type: 'confirm',
				name: 'watch',
				message: 'Do you want to a "watch" script for live development (hot reload)?',
				default: true
			},
			{
				type: 'list',
				name: 'template',
				message: 'What project template do you want to start from?',
				choices: Object.entries(Templates).map(([_, template]) => {
					return { name: template.value, value: template }
				})
			}
		])
		debug('answers', this.answers)
		this.templateAnswers = await this.prompt(this.answers.template.prompts)
		debug('templateAnswers', this.templateAnswers)
	}

	configuring () {
		const { template, templateAnswers, watch, ...answersWithoutTemplate } = this.answers
		answersWithoutTemplate.keywords = answersWithoutTemplate.keywords === '' ? [] : answersWithoutTemplate.keywords.split(',')

		if (watch) {
			answersWithoutTemplate.script = {
				watch: `nodemon jolie ${answersWithoutTemplate.main}`
			}
			answersWithoutTemplate.devDependencies = {
				nodemon: '^2.0.19'
			}
		}
		this.answersWithoutTemplate = answersWithoutTemplate
	}

	async writing () {
		debug('writing package.json', this.answersWithoutTemplate)

		this.fs.writeJSON(this.destinationPath('package.json'), this.answersWithoutTemplate)
		this.answers.template.scaffold(this)
	}

	install () {
		this.spawnCommandSync('npx', ['@jolie/jpm', 'init'])

		if (this.answers.watch) {
			this.spawnCommandSync('npm', ['install', '-D', 'nodemon'])
		}

		for (const templateName in Templates) {
			const template = Templates[templateName]
			if (template.value == this.answers.template) {
				template.install(this)
				break
			}
		}
	}

	end () {
		this.log('Jolie project initialised')
	}
}
