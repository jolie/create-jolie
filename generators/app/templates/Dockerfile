FROM jolielang/jolie:<%- version %>

WORKDIR /app
COPY . .
<% if (typeof tcpPort !== 'undefined') { %>
EXPOSE <%- tcpPort %>
<% } %>
CMD ["jolie", "main.ol"]