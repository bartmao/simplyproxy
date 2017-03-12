const stream = require('stream');
const util = require('util');
const uuid = require('node-uuid');

function UnescapeStream() {
    if (!(this instanceof UnescapeStream))
        return new UnescapeStream();

    stream.Transform.call(this);

    this.init = function init() {
        this.remoteSocket = ''; //16
        this.localSocket = ''; // 16
        this.localPort = 0; //4
        this.remotePort = 0; // 4
        this.len = 0;//4

        this.buffer = new Buffer(16);
        this.state = 0;
        this.pos = 0;

    }

    this.init();
}



UnescapeStream.prototype._transform = function (chunk, enc, cb) {
    var i = 0;
    while (i < chunk.length) {
        if (this.state == 0) {
            if (this.pos < 16)
                this.buffer[this.pos++] = chunk[i];
            else {
                if (this.buffer.readUInt16LE())
                    this.remoteSocket = uuid.unparse(this.buffer.slice(0, 16));
                this.state++;
                this.pos = 0;
                i--;
            }
        }
        else if (this.state == 1) {
            if (this.pos < 16)
                this.buffer[this.pos++] = chunk[i];
            else {
                if (this.buffer.readUInt16LE())
                    this.localSocket = uuid.unparse(this.buffer.slice(0, 16));
                this.state++;
                this.pos = 0;
                i--;
            }
        }
        else if (this.state == 2) {
            if (this.pos < 4)
                this.buffer[this.pos++] = chunk[i];
            else {
                this.remotePort = this.buffer.readInt32LE(0);
                this.state++;
                this.pos = 0;
                i--;
            }
        }
        else if (this.state == 3) {
            if (this.pos < 4)
                this.buffer[this.pos++] = chunk[i];
            else {
                this.localPort = this.buffer.readInt32LE(0);
                this.state++;
                this.pos = 0;
                i--;
            }
        }
        else if (this.state == 4) {
            if (this.pos < 4)
                this.buffer[this.pos++] = chunk[i];
            else {
                this.len = this.buffer.readInt32LE(0);
                this.state++;
                this.pos = 0;
                i--;
            }
        }
        else {
            var lenToRead = this.len - this.pos;
            var lenRemains = chunk.length - i;
            if (lenToRead > lenRemains) {
                this.push(chunk.slice(i));
                cb();
                break;
            }
            else {
                this.push(chunk.slice(i, lenToRead + i));
                cb();
                this.init();
                i += lenToRead;
            }
        }

        ++i;
    }
}

util.inherits(UnescapeStream, stream.Transform);

module.exports = UnescapeStream;
