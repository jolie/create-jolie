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
	}

	end () {
		this.log('A Jolie project is initialized.')
	}
}
