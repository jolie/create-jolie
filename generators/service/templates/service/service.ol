<%_ file.imports?.forEach( imp => { _%>
from <%= imp.module %> import <%= imp.symbols.map( symbol => `${symbol.target}${symbol.as ? " as " + symbol.as : ""}` ).join(", ") %>
<%_ } ) _%>
<%_ file.interfaces?.forEach( iface => { _%>
<%- include( './partials/interfaces', {interface: iface} ); %>
<%_ } ) _%>
<%_ file.services?.forEach( serv => { _%>
<%- include( './partials/services', {service: serv} ); %>
<%_ } ) _%>
<%#
{
    imports?: [{
        module: "",
        symbols: [{
            target: "",
            as: ""
        }]
    }],
    interfaces?: [{
        // see interfaces.ejs
    }]
    services?: [{
        // see services.ejs
    }]
}
#%>