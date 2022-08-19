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
			console.log(gen.templateAnswers.mainServiceName)
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
			{ type: 'input', name: 'keywords', message: 'keywords (space-delimited)' },
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
				choices: [
					Templates.EMPTY.value,
					Templates.SCRIPT.value
				],
				default: 0
			}
		])
		debug(this.answers)

		for (const templateName in Templates) {
			const template = Templates[templateName]
			if (template.value == this.answers.template) {
				this.templateAnswers = await this.prompt(template.prompts)
				break
			}
		}
	}

	configuring () {

	}

	async writing () {
		this.composeWith(require.resolve('generator-npm-init/app'), {
			'skip-name': true,
			'skip-description': true,
			'skip-version': true,
			'skip-main': true,
			'skip-repo': true,
			'skip-keywords': true,
			'skip-author': true,
			'skip-license': true,
			'skip-test': true,
			name: this.answers.name,
			description: this.answers.description,
			version: this.answers.version,
			main: this.answers.main,
			repo: this.answers.repo,
			keywords: this.answers.keywords ? this.answers.keywords : [],
			author: this.answers.author,
			license: this.answers.license,
			test: this.answers.test,
			scripts: this.answers.watch
				? {
					watch: `nodemon jolie ${this.answers.main}`
				}
				: null
		})

		for (const templateName in Templates) {
			const template = Templates[templateName]
			if (template.value == this.answers.template) {
				template.scaffold(this)
				break
			}
		}
	}

	install () {
		this.spawnCommandSync('npx', ['@jolie/jpm', 'init'])
		if (this.answers.watch) {
			this.spawnCommandSync('npm', ['install', '-D', 'nodemon'])
		}
	}

	end () {
		this.log('A Jolie project is initialised.')
	}
}
