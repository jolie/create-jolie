const Generator = require('yeoman-generator')
const semver = require('semver')
const { which, exec } = require('shelljs')
const chalk = require('chalk')

/**
 * Returns true if jolie execuable is present in the PATH
 *
 * @return {Boolean}
 */
function isJolieExists () {
	return !!which('jolie')
}

const jolieVersionRegex = /^Jolie (\d+.\d+..*?)[\s]/

/**
   * Search latest version of an project on maven repository
   *
   * @return {Promise<string>} the latest version on maven repository
   *
   * @throws Error unable to connect to MVN repository
   *
   */
async function getMavenLatestProjectVersion (groupID, artifactID) {
	const endpoint = `http://search.maven.org/solrsearch/select?q=g:%22${groupID}%22+AND+a:%22${artifactID}%22`

	const response = await fetch(endpoint)

	if (!response.ok) throw Error('Unable to fetch jolie latest version from maven repository')

	 const {
		response: { docs }
	} = await response.json()
	return docs[0].latestVersion
}

/**
 * Get Jolie version from local machine or from the released
 *
 * @param {Promise<Boolean>} local flag for determine the location to get jolie version
 * @return {*}
 */
async function getJolieVersion (local) {
	if (local) {
		return exec('jolie --version', { silent: true }).stderr.match(jolieVersionRegex)[1]
	} else {
		return await getMavenLatestProjectVersion('org.jolie-lang', 'libjolie')
	}
}

module.exports = class extends Generator {
	constructor (args, opts) {
		super(args, opts)
		this.service_name = opts.service_name
		this.module = opts.module
		this.packageJSONAnswers = opts.packageJSONAnswers
	}

	async prompting () {
		this.answers = await this.prompt([
			{
				type: 'input',
				name: 'groupId',
				message: 'groupId',
				default: 'org.jolie-lang.joliex',
				validate: id => id.match(/^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/) ? true : 'The groupId is invalid, please specify a dot-delimited id comprised only of lowercase english letters, digits, and hyphens'
			},
			{
				type: 'input',
				name: 'artifactId',
				message: 'artifactId',
				default: this.packageJSONAnswers.name.replaceAll(/[^a-z0-9-]/g, ''),
				validate: id => id.match(/^[a-z0-9-]+$/) ? true : 'The artifactId is invalid, please specify an id comprised only of lowercase english letters, digits, and hyphens'
			},
			{
				type: 'input',
				name: 'javaVersion',
				message: 'Java version',
				default: '21',
				validate: version => {
					const v = Number(version)
					if (isNaN(v)) { return 'The Java version must be a number' }
					if (v < 21) { return 'The Java version must at least be 21' }
					return true
				}
			},
			{ type: 'confirm', name: 'standalone', message: 'Do you want a launcher service (standalone service)?', default: false }
		])
	}

	async configuring () {
		this.hasLocalJolie = isJolieExists()

		this.jolieVersion = await getJolieVersion(this.hasLocalJolie)

		const interfaces = []
		const services = []

		if (this.answers.standalone) {
			const launcherName = `${this.service_name}Launcher`
			services.push({
				name: launcherName,
				embeds: [this.service_name],
				input_ports: [{
					name: `${this.service_name}Input`,
					location: 'socket://localhost:8080',
					protocol: 'http { format = "json" }',
					aggregates: [this.service_name]
				}],
				code: 'linkIn( Shutdown )'
			})

			this.packageJson.merge({
				scripts: {
					prestart: 'mvn package',
					start: `jolie --service ${launcherName} ${this.module}`
				}
			})
		}

		const packageName = (this.answers.groupId + '.' + this.answers.artifactId).replaceAll('-', '_')
		const interfaceName = `${this.service_name}Interface`

		interfaces.push({
			name: interfaceName,
			rrs: [{
				name: 'hello',
				requestType: 'void',
				responseType: 'string'
			}]
		})

		services.push({
			name: this.service_name,
			input_ports: [{
				name: 'ip',
				location: 'local',
				interfaces: [interfaceName]
			}],
			foreign: {
				type: 'java',
				class: `${packageName}.${this.service_name}`
			}
		})

		this.config.merge({
			jolie_file: {
				interfaces,
				services
			}
		})

		this.packageJson.merge({
			scripts: {
				'clean-generate': 'rimraf -g "./src/main/java/*" && npm run generate',
				generate: `jolie2java --outputDirectory "./src/main/java" --packageName "${packageName}" --typePackage "${packageName}.spec.types" --faultPackage "${packageName}.spec.faults" --interfacePackage "${packageName}.spec.interfaces" --serviceName "${this.service_name}" --generateService 0 ${this.module}`
			}
		})

		await this.addDevDependencies({ rimraf: '^5' })
	}

	async writing () {
		if (!this.hasLocalJolie) {
			this.log(`Unable to locate local Jolie executable, please visit Jolie download page ${chalk.blue.underline('https://www.jolie-lang.org/downloads.html')}`)
		}

		if (semver.lt(this.jolieVersion, '1.13.0')) {
			this.log(`The Jolie version found is older than ${chalk.blue('1.13.0')}. Please upgrade your Jolie version to at least ${chalk.blue('1.13.0')}.`)
			this.jolieVersion = '1.13.0'
		}

		this.renderTemplate(
			'java/pom.xml',
			'pom.xml',
			{
				groupId: this.answers.groupId,
				artifactId: this.answers.artifactId,
				version: this.packageJSONAnswers.version,
				name: this.packageJSONAnswers.name,
				url: this.packageJSONAnswers.repo,
				javaVersion: this.answers.javaVersion,
				jolieVersion: this.jolieVersion
			}
		)
	}

	async install () {
		this.spawnCommandSync('npm', ['run', 'generate'])
	}
}
