const net = require('net');
const uuid = require('node-uuid');
const EscapeStream = require('./escapestream');
const UnescapeStream = require('./unescapestream');

function ProxyServer() {
    if (!(this instanceof ProxyServer))
        return new ProxyServer();

    this.rconfig = {};
    this.remoteSockets = {};
    this.init = true;
    var instance = this;

    this.server = net.createServer(lrSocket => {
        console.log(lrSocket.address());

        lrSocket.on('data', data => {
            if (instance.init) {
                instance.init = false;
                var config = JSON.parse(data.toString('utf8'));
                if (config) {
                    parseConfig(config);
                    console.log(config);
                    lrSocket.write('ok');

                    var unescapestream = new UnescapeStream();
                    lrSocket.pipe(unescapestream).on('data', chunk => {
                        var socket = instance.remoteSockets[unescapestream.remoteSocket];
                        if (socket)
                            socket.write(chunk);
                    });
                }
                else {
                    console.warn('bad format');
                    lrSocket.end('bad format');
                }
            }
        });

        function parseConfig(config) {
            var r = config.r;
            r.forEach(e => {
                var pp = e.split(',');
                var localPort = parseInt(pp[0]);
                var remotePort = parseInt(pp[1]);
                var entry = {
                    lp: localPort,
                    rp: remotePort,
                    srv: null
                };
                instance.rconfig['r' + remotePort] = entry;
                createRListener(entry);
            }, instance);
        }

        function createRListener(entry) {
            var port = entry.rp;
            var srv = net.createServer(remoteSocket => {
                var uuidBuf = Buffer.alloc(16);
                uuid.v4(null, uuidBuf);
                var remoteId = uuid.unparse(uuidBuf);
                instance.remoteSockets[remoteId] = remoteSocket;
                var escapestream = new EscapeStream({
                    remoteSocket: uuidBuf,
                    localSocket: null,
                    remotePort: port,
                    localPort: entry.lp
                });
                console.log(`remote socket ${remoteId} established`);
                remoteSocket.on('close', haderr => {
                    remoteSocket.unpipe(escapestream);
                    // end exception
                    //escapestream.write(Command['DELETELS']);
                    delete instance.remoteSockets[remoteId];
                    console.log(`Remote socket ${remoteId} closed`);
                });
                // directly pipe to lrSocket may cause lrSocket ended unexpectly.
                remoteSocket.pipe(escapestream).on('data', data=> lrSocket.write(data));
            }).listen(port);

            entry.srv = srv;
        }
    }).listen(10086);
}



module.exports = ProxyServer;