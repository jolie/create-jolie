#!/bin/env jolie

import console as Console

service Main {

    embed Console as Console

    main {
        println@Console("Hello World!")()
    }
}