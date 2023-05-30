from protocols.http import DefaultOperationHttpRequest
from console import Console
from string-utils import StringUtils
from @jolie.leonardo import WebFiles

/// Operations offered through the web interface
interface WebInterface {
RequestResponse:
	/// Generic GET request
	get( DefaultOperationHttpRequest )( undefined )
}

service Main {
	execution: concurrent

	embed Console as console
	embed WebFiles as webFiles
	embed StringUtils as stringUtils

	inputPort WebInput {
		location: "socket://localhost:<%= tcpPort %>"
		protocol: http {
			format -> httpParams.format
			contentType -> httpParams.contentType
			cacheControl.maxAge -> httpParams.cacheControl.maxAge
			redirect -> redirect
			statusCode -> statusCode
			default.get = "get"
		}
		interfaces: WebInterface
	}

	init {
		global.wwwDir = "web"
		format = "html"

		println@console( "Server started at " + global.inputPorts.WebInput.location )()
	}

	main {
		get( request )( response ) {
			scope( get ) {
				install(
					FileNotFound =>
						statusCode = 404,
					MovedPermanently =>
						redirect = get.MovedPermanently
						statusCode = 301
				)
				get@webFiles( {
					target = request.operation
					wwwDir = global.wwwDir
				} )( getResult )
				httpParams -> getResult.httpParams
				response -> getResult.content
			}
		}
	}
}
