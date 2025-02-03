import path from 'path'

export default {
	mode: 'production',
	entry: './js/index.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'web', 'js'),
	}
}