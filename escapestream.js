const stream = require('stream');
const util = require('util');
const uuid = require('node-uuid');

function EscapeStream(config) {
    if (!(this instanceof EscapeStream))
        return new EscapeStream(config);

    stream.Transform.call(this);

    this.init = function init(config) {
        this.remoteSocket = config.remoteSocket; //16
        this.localSocket = config.localSocket; // 16
        this.localPort = config.localPort; //4
        this.remotePort = config.remotePort; // 4
    }

    this.init(config);
}

EscapeStream.prototype._transform = function (chunk, enc, cb) {
    var buf = Buffer.alloc(chunk.length + 44);
    if (this.remoteSocket)
        this.remoteSocket.copy(buf, 0);
    if (this.localSocket)
        this.localSocket.copy(buf, 16);
    buf.writeInt32LE(this.remotePort, 32)
    buf.writeInt32LE(this.localPort, 36)
    buf.writeInt32LE(chunk.length, 40)
    chunk.copy(buf, 44);
    this.push(buf);
    cb();
    console.log(`escape stream. remote:${uuid.unparse(this.remoteSocket)}:local:${this.localSocket?uuid.unparse(this.localSocket):'empty'}`);
}

util.inherits(EscapeStream, stream.Transform);

module.exports = EscapeStream;