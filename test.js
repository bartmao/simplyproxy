var escapestream = require('./escapestream');
var unescapestream = require('./unescapestream');
var ProxyServer = require('./proxyserver');
var ProxyClient = require('./proxyclient');
var fs = require('fs');
var net = require('net');

var echo = net.createServer(s => {
    s.on('data', data => s.write(data));
}).listen(8000);

var remote = new ProxyServer();
var local = new ProxyClient(() => {
    var client = net.createConnection({ port: 8002 }, () => {
        client.write('my test');
        client.on('data',data=>{
            console.log(data.toString('utf8'));
        });
    });
});


