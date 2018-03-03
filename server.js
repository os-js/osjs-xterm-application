/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2018, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

const pty = require('node-pty');
const uuidv4 = require('uuid/v4');

let connections = {};
let terminals = [];

/**
 * Creates a new Terminal
 */
const createTerminal = (ws, options, args = []) => {
  console.log('[Xterm]', 'Creating terminal...');
  const size = options.size || {cols: 80, rows: 24};
  const term = pty.spawn('bash', args, {
    cols: size.cols,
    rows: size.rows,
    name: 'xterm-color',
    cwd: process.cwd(),
    env: process.env
  });

  const kill = () => {
    console.log('[Xterm]', 'Closing terminal...');
    term.kill();

    const foundIndex = terminals.findIndex(t => t.pid == term.pid);
    if (foundIndex !== -1) {
      terminals.splice(foundIndex, 1);
    }

    if (connections[options.uuid]) {
      delete connections[options.uuid];
    }
  };

  term.on('data', (data) => ws.send(data));
  ws.on('message', (data) => term.write(data));
  ws.on('close', () => kill());

  terminals.push({
    uuid: options.uuid,
    terminal: term
  });

  return term;
};

/**
 * Creates a new Terminal connection
 */
const createConnection = (ws) => {
  console.log('[Xterm]', 'Creating connection...');
  let pinged = false;

  ws.on('message', (uuid) => {
    if ( !pinged ) {
      try {
        const term = createTerminal(ws, connections[uuid]);
        ws.send(String(term.pid));
        pinged = {uuid, pid: term.pid};
      } catch (e) {
        console.warn(e);
      }
    }
  });
};

/**
 * Add routes for application
 */
const init = async (core, metadata) => {
  const {app} = core;

  app.post(`/packages/${metadata._path}/create`, (req, res) => {
    console.log('[Xterm]', 'Requested connection...');

    const uuid = uuidv4();

    connections[uuid] = {
      options: req.body,
      uuid,
    };

    res.json({uuid});
  });

  app.post(`/packages/${metadata._path}/resize`, (req, res) => {
    console.log('[Xterm]', 'Requested resize...');

    const {size, pid, uuid} = req.body;
    const {cols, rows} = size;

    const found = terminals.find(iter => (
      iter.terminal.pid === pid && iter.uuid === uuid
    ));

    if (found) {
      found.terminal.resize(cols, rows);
    }
  });

  app.ws(`/packages/${metadata._path}/socket`, (ws, req) => {
    createConnection(ws);
  });
};

/**
 * Start the server
 */
const start = (core, metadata) => {
};

/**
 * Destroy the server
 */
const destroy = () => {
  terminals.forEach(iter => iter.terminal.kill());
  terminals = [];
};

module.exports = {
  init,
  start,
  destroy
};
