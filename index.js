var escapestream = require('./escapestream');
var unescapestream = require('./unescapestream');
var ProxyServer = require('./proxyserver');
var ProxyClient = require('./proxyclient');
var fs = require('fs');
var net = require('net');

var server = new ProxyServer();

var local = new ProxyClient(() => {
    console.log('connected');
});