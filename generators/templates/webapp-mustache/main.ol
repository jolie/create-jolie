from protocols.http import DefaultOperationHttpRequest
from console import Console
from string-utils import StringUtils
from mustache import Mustache
from reflection import Reflection
from runtime import Runtime
from @jolie.leonardo import WebFiles

/// Operations offered through the web interface
interface WebInterface {
RequestResponse:
	/// Generic GET request
	get( DefaultOperationHttpRequest )( undefined )
}

/// Type of the data needed by index.html
type IndexData {
	jolieVersion:string //< The version of the Jolie interpreter running this service
}

/// Operations that generate the data needed by the Mustache templates
interface MustacheOperations {
RequestResponse:
	/// Gets the data needed by the index.html page
	index( void )( IndexData )
}

service Main {
	execution: concurrent

	embed Console as console
	embed WebFiles as webFiles
	embed StringUtils as stringUtils
	embed Mustache as mustache
	embed Runtime as runtime
	embed Reflection as reflection

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

	inputPort Local {
		location: "local"
		interfaces: MustacheOperations
	}

	outputPort self {
		interfaces: MustacheOperations
	}

	init {
		global.wwwDir = "web"
		global.templatesDir = "templates"
		format = "html"
		getLocalLocation@runtime()( self.location )

		dataBindings

		println@console( "Server started at " + global.inputPorts.WebInput.location )()
	}

	// Define your data bindings for Mustache templates here
	define dataBindings {
		// Page index.html gets data from operation index
		global.dataBindings.("/index.html") = "index"
	}

	main {
		[ get( request )( response ) {
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
				
				substring@stringUtils( getResult.path { begin = length@stringUtils( global.wwwDir ) } )( webPath )
				// By default, Mustache is activated only for html pages
				if( getResult.httpParams.format == "html" ) {
					if( is_defined( global.dataBindings.(webPath) ) ) {
						invoke@reflection( {
							operation = global.dataBindings.(webPath)
							outputPort = "self"
						} )( data )
					} else {
						data << {}
					}
					render@mustache( {
						template -> getResult.content
						data -> data
						dir = global.templatesDir
					} )( response )
				} else {
					response -> getResult.content
				}
			}
		} ]

		[ index()( response ) {
			getVersion@runtime()( response.jolieVersion )
		} ]
	}
}
