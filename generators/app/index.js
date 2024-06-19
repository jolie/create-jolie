const Generator = require('yeoman-generator')
const path = require('path')
const semver = require('semver')
const os = require('os')
const boxen = require('boxen')
const dedent = require('dedent')

module.exports = class extends Generator {
	async initializing () {
		this.log('Start creating a Jolie project.')
	}

	async prompting () {
		this.packageJSONAnswers = await this.prompt([
			{
				type: 'input',
				name: 'name',
				message: 'Package name',
				default: path.basename(process.cwd()).toLowerCase(),
				validate: name => name.match(/^(?:(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/[a-z0-9-._~])|[a-z0-9-~])[a-z0-9-._~]*$/) ? true : 'The package name was invalid, please specify a valid package name or scoped package name'
			},
			{
				type: 'input',
				name: 'version',
				message: 'Version',
				default: '0.0.0',
				validate: version => semver.valid(version) !== null ? true : 'The version is invalid, please specify a valid Semantic Versioning'
			},
			{ type: 'input', name: 'description', message: 'Package description' },
			{ type: 'input', name: 'repo', message: 'Git repository URL' },
			{ type: 'input', name: 'keywords', message: 'Package keywords (comma-delimited)', default: '' },
			{ type: 'input', name: 'author', message: 'Author', default: os.userInfo().username },
			{ type: 'input', name: 'license', message: 'License', default: 'ISC' }
		])

		this.project = await this.prompt([
			{ type: 'input', name: 'module', message: 'Module file name', default: 'main.ol' },
			{
				type: 'list',
				name: 'template',
				message: 'Project template',
				choices: [
					{ name: 'Service', value: 'service' },
					{ name: 'Web application', value: 'web' },
					{ name: 'Script', value: 'script' }
				]
			}
		])
		this.composeWith(require.resolve(`../${this.project.template}`), { module: this.project.module, packageJSONAnswers: this.packageJSONAnswers })
	}

	async configuring () {
		this.packageJSONAnswers.keywords = this.packageJSONAnswers.keywords === '' ? [] : this.packageJSONAnswers.keywords.split(',')
		this.packageJson.merge({
			...this.packageJSONAnswers
		})
		this.packageJson.merge({ scripts: { postinstall: 'npx @jolie/jpm install' } })
		// ensures docker is composed last
		this.composeWith(require.resolve('./docker'), { module: this.project.module })
	}

	async writing () {
		this.debug('writing')
	}

	async install () {
		this.debug('install')
		this.spawnCommandSync('npx', ['@jolie/jpm', 'init'])
		this.spawnCommandSync('npm', ['install'])
	}

	async end () {
		this.debug('end')
		this.fs.delete('.yo-rc.json')
		this.log(boxen(dedent`🎇 Jolie project initialised 🎆`, { padding: 1 }))
	}
}
