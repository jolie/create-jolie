FROM jolielang/jolie:edge

WORKDIR /app
COPY . .
<% if (typeof tcpPort !== 'undefined') { %>
EXPOSE <%= tcpPort %>
<% } %>
CMD ["jolie", "<%= module %>"]