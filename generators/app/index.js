const Generator = require('yeoman-generator')
const path = require('path')
const semver = require('semver')
const os = require('os')
const boxen = require('boxen')
const dedent = require('dedent')
const { which, exec } = require('shelljs')
const chalk = require('chalk')

const JOLIE_DOWNLOAD = 'https://www.jolie-lang.org/downloads.html'

/**
   * Searches the maven repository for the latest version of the given project
   *
   * @return {Promise<string>} the latest version of the given project
   *
   * @throws Error unable to connect to the MVN repository
   *
   */
async function getMavenLatestProjectVersion (groupID, artifactID) {
	const endpoint = `http://search.maven.org/solrsearch/select?q=g:%22${groupID}%22+AND+a:%22${artifactID}%22`

	const response = await fetch(endpoint)

	if (!response.ok) throw Error(`Unable to fetch the latest version of jolie, consider downloading it from: ${chalk.blue.underline(JOLIE_DOWNLOAD)}`)

	const {
		response: { docs }
	} = await response.json()
	return semver.parse(docs[0].latestVersion)
}

module.exports = class extends Generator {
	async initializing () {
		if (which('jolie')) {
			this.jolieVersion = semver.parse(exec('jolie --version', { silent: true }).stderr.match(/^Jolie (\d+.\d+..*?)[\s]/)[1])
		} else {
			this.log('Unable to locate local Jolie installation, fetching the latest version...')
			this.jolieVersion = await getMavenLatestProjectVersion('org.jolie-lang', 'libjolie')
			this.log(`Found version ${this.jolieVersion}, consider downloading it from: ${chalk.blue.underline(JOLIE_DOWNLOAD)}`)
		}
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
			{ type: 'input', name: 'author', message: 'Author', default: os.userInfo().username, store: true },
			{ type: 'input', name: 'license', message: 'License', default: 'ISC' }
		])

		this.project = await this.prompt([
			{
				type: 'input',
				name: 'module',
				message: 'Module file name',
				default: 'main.ol',
				validate: m => m.match(/^[\p{L}\p{N}_-]+(?:\.ol)?$/u) ? true : 'The file name is invalid, please specify a valid file name with no weird symbols',
				filter: m => m.endsWith('.ol') ? m : `${m}.ol`
			},
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
		this.composeWith(require.resolve(`../${this.project.template}`), { module: this.project.module, packageJSONAnswers: this.packageJSONAnswers, jolieVersion: this.jolieVersion })
	}

	async configuring () {
		this.packageJSONAnswers.keywords = this.packageJSONAnswers.keywords === '' ? [] : this.packageJSONAnswers.keywords.split(',')
		this.packageJson.merge({
			...this.packageJSONAnswers
		})
		this.packageJson.merge({ scripts: { postinstall: 'jpm install' } })

		await this.addDevDependencies({ '@jolie/jpm': '2.1.3' })
	}

	// ensures docker is composed last
	async docker () {
		this.composeWith(require.resolve('./docker'), { jolieVersion: this.jolieVersion })
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
		this.log(boxen(dedent`🎇 Jolie project initialized 🎆`, { padding: 1 }))
	}
}
