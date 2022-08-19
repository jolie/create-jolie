#!/bin/env jolie

from console import Console

service <%= Main %> {
	embed Console as console
	main {
		println@console( "Hello, world!" )()
	}
}