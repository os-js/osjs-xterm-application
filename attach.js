// This is a custom AttachAddon implementation

function addSocketListener(socket, type, handler) {
  socket.addEventListener(type, handler);
  return {
    dispose: () => {
      if (!handler) {
        // Already disposed
        return;
      }
      socket.removeEventListener(type, handler);
    }
  };
}

export class AttachAddon {
  constructor(socket, options) {
    this._socket = socket;
    // always set binary type to arraybuffer, we do not handle blobs
    this._socket.binaryType = 'arraybuffer';
    this._bidirectional = (options && options.bidirectional === false) ? false : true;
    this._disposables = [];
  }

  activate(terminal) {
    this._disposables.push(
      addSocketListener(this._socket, 'message', ev => {
        const data = ev.data;
        if (typeof data === 'string') {
          const message = JSON.parse(data);
          if (message.content) {
            terminal.write(message.content);
          }
        } else {
          terminal.write(new Uint8Array(data));
        }
      })
    );

    if (this._bidirectional) {
      this._disposables.push(terminal.onData(data => this._sendData(data)));
      this._disposables.push(terminal.onBinary(data => this._sendBinary(data)));
    }

    this._disposables.push(addSocketListener(this._socket, 'close', () => this.dispose()));
    this._disposables.push(addSocketListener(this._socket, 'error', () => this.dispose()));
  }

  dispose() {
    this._disposables.forEach(d => d.dispose());
  }

  _sendData(data) {
    // TODO: do something better than just swallowing
    // the data if the socket is not in a working condition
    if (this._socket.readyState !== 1) {
      return;
    }
    this._socket.send(JSON.stringify({data}));
  }

  _sendBinary(data) {
    if (this._socket.readyState !== 1) {
      return;
    }
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; ++i) {
      buffer[i] = data.charCodeAt(i) & 255;
    }
    this._socket.send(buffer);
  }
}
