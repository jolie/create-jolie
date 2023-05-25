<%_ if (script) { _%>
#!/bin/env jolie
<%_ } _%>

<%_ if (typeof (imports) !== 'undefined' && Array.isArray(imports)) { _%>
<%_ imports.forEach(function(imp){ _%>
from <%= imp.module _%> <%= " import " _%> <%= imp.symbols.map(symbol => `${symbol.target}${symbol.as? " as " + symbol.as:""}` ).join(",") _%>
<%_ }) %>
<%_ } _%>

<%_ if (typeof (interfaces) !== 'undefined' && Array.isArray(interfaces)) { _%>
<% interfaces.forEach(function(iface){ _%>
<%- include('interfaces', iface); _%>
<%_ }) _%>
<%_ } _%>

service <%= name %> {

    <%_ if (typeof (embeds) !== 'undefined' && Array.isArray(embeds)) { _%>
    <%_ embeds.forEach(function(embed){ _%>
    <%= `embed ${embed} as ${embed}` %>
    <%_ }) _%>
    <%_ } _%>

    <%_ if (typeof (input_ports) !== 'undefined' && Array.isArray(input_ports)) { _%>
    <%_ input_ports.forEach(function(ip){ _%>
    inputPort <%= ip.name %> {
        location: "<%= ip.location %>"
        <%_ if (ip.protocol) { _%>
        protocol: "<%= ip.protocol %>"
        <%_ } _%>
        interfaces: <%= ip.interfaces %>
    }<%_ }) _%>
    <%_ } _%>

    <%_ if (typeof (output_ports) !== 'undefined' && Array.isArray(output_ports)) { _%>
    <%_ output_ports.forEach(function(op){ _%>
    outputPort <%= op.name _%> {
        location: "<%= op.location _%>"
        <%_ if (op.protocol) { _%>
        protocol: "<%= op.protocol _%>"
        <%_ } _%>
        interfaces: <%= op.interfaces _%>
    }<%_ }) _%>
    <%_ } _%>

    <%_ if (typeof (execution) !== 'undefined') { _%>
    execution: <%= execution %>
    <%_ } _%>

	main {
        <%_ if (typeof (code) !== 'undefined') { _%>
        <%- code %>
        <%_ } else { _%>
		// Your code here
        <%_ } _%>
	}
}
<%#
{
    name: "service name",
    script: bool,
    interfaces: [{
        // see interface.ejs
    }]
    imports: [{
        module: "",
        symbols: [{
            target: "",
            as: ""
        }]
    },...]
    embeds: ["service to embed"]
    input_ports: [{
        name: "",
        location: "",
        protocol?: ""
    }]
    output_ports: [{
        name: "",
        location: "",
        protocol: ""
    }]
    execution: ""
}
#%>