
interface iface {
    RequestResponse: hello(void)(string)
}

service Main {

    inputPort IP {
        Location: "local"
        Interfaces: iface
    }

    execution { concurrent }
	
    main {
        [hello()(res) {
            res = "World"
        }]
	}
}