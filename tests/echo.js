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
    console.log('connected');
    ping();
});

function ping(){
    echoMsg(new Date().toTimeString());
}

function echoMsg(msg) {
    var client = net.createConnection({ port: 8002 }, () => {
        client.write(msg);
        client.on('data', data => {
            console.log('From server:' + data.toString('utf8'));
            client.end();
            setTimeout(ping, 1000);
        });
    });
}