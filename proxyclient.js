const net = require('net');
const uuid = require('node-uuid');
const config = require('./config.json');
const EscapeStream = require('./escapestream');
const UnescapeStream = require('./unescapestream');

function ProxyClient(cb) {
    if (!(this instanceof ProxyClient))
        return new ProxyClient();

    this.localSockets = {};
    this.init = true;
    var instance = this;

    var lrSocket = net.createConnection({
        port: 10086
    }, () => {
        console.log('connected');
        lrSocket.write(JSON.stringify(config), 'utf8');

    });

    lrSocket.on('data', data => {
        if (instance.init) {
            instance.init = false;
            var resp = data.toString('utf8');
            if (resp == 'ok') {
                console.log('set up the proxies');
                cb();
                var unescapestream = new UnescapeStream();
                lrSocket.pipe(unescapestream).on('data', chunk => {
                    var localSocket;
                    if (!unescapestream.localSocket)
                        createLocalSocket(unescapestream.localPort
                            , unescapestream.remoteSocket
                            , unescapestream.remotePort
                            , ls => ls.write(chunk));
                    else if (localSocket = instance.localSockets[unescapestream.localSocket]) {
                        localSocket.write(chunk);
                    }
                });
            }
        }

        function createLocalSocket(localPort, remoteSocket, remotePort, cb) {
            var localSocket = net.createConnection({
                port: localPort
            }, () => {
                var uuidBuf = Buffer.alloc(16);
                uuid.v4(null, uuidBuf);
                var localId = uuid.unparse(uuidBuf);
                instance.localSockets[localId] = localSocket;

                var remoteUUIDBuf = Buffer.alloc(16);
                uuid.parse(remoteSocket, remoteUUIDBuf);
                localSocket.pipe(new EscapeStream({
                    remoteSocket: remoteUUIDBuf,
                    localSocket: uuidBuf,
                    remotePort: remotePort,
                    localPort: localPort
                })).pipe(lrSocket);
                cb(localSocket);
            });
        }
    });
}

module.exports = ProxyClient;