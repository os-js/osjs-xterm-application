/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) Anders Evenrud <andersevenrud@gmail.com>
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

import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import * as clipboard from 'clipboard-polyfill';
import {AttachAddon} from './attach.js';

import './index.scss';
import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

/*
 * Creates a new Terminal connection
 */
const createConnection = async (core, proc, win, term, fit) => {
  const params = {
    connection: {
    },
    size: {
      cols: term.cols,
      rows: term.rows
    }
  };

  term.clear();
  term.writeln('Requesting connection....');

  const {uuid} = await proc.request('/create', {method: 'post', body: params});
  const pingInterval = core.config('xterm.ping', 30000);

  const ws = proc.socket('/socket', {
    socket: {
      reconnect: false
    }
  });

  const attachAddon = new AttachAddon(ws.connection);
  term.loadAddon(attachAddon);

  let pinger;
  let closed = false;
  let pinged = false;
  let pid = -1;

  ws.on('open', () => {
    ws.send(uuid);

    pinger = setInterval(() => {
      ws.send(JSON.stringify({action: 'ping'}));
    }, pingInterval);
  });

  ws.on('message', (ev) => {
    if (pinged) {
      const message = JSON.parse(ev.data);
      if (message.action === 'exit' && message.event.exitCode === 0) {
        win.close();
      }
    } else {
      pinged = true;
      pid = parseInt(ev.data, 10);

      proc.request('/resize', {method: 'post', body: {size: params.size, pid, uuid}});
      fit();
    }
  });

  ws.on('close', () => {
    term.writeln('... Disconnected. Press any key to close terminal ...');
    closed = true;
    clearInterval(pinger);
  });

  term.onKey(() => {
    if (closed) {
      win.destroy();
    }
  });

  term.onResize((size) => {
    const {cols, rows} = size;
    proc.request('/resize', {method: 'post', body: {size: {cols, rows}, pid, uuid}});
  });

  win.on('destroy', () => {
    ws.destroy();
    term.dispose();
  });

  fit();
};

/*
 * Creates a new Terminal and Window
 */
const createTerminal = (core, proc, index) => {
  const term = new Terminal();

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  const fit = () => {
    setTimeout(() => {
      fitAddon.fit();
      term.focus();
      term.scrollToBottom();
    }, 100);
  };

  const render = ($content) => {
    term.open($content);
    fitAddon.fit();
    term.focus();

    $content.addEventListener('contextmenu', ev => {
      ev.preventDefault();

      core.make('osjs/contextmenu', {
        position: ev,
        menu: [{
          label: 'Copy text selection',
          onclick: () => clipboard.writeText(
            term.getSelection()
          )
        }, {
          label: 'Paste from clipboard',
          onclick: () => clipboard.readText()
            .then(data => term.write(data))
        }]
      });
    });
  };

  proc.createWindow({
    id: 'Xterm_' + String(index),
    title: proc.metadata.title.en_EN,
    icon: proc.resource(proc.metadata.icon),
    dimension: {width: 960, height: 288},
    attributes: {
      classNames: ['Window_Xterm']
    }
  })
    .on('resized', fit)
    .on('maximize', fit)
    .on('restore', fit)
    .on('moved', () => term.focus())
    .on('focus', () => term.focus())
    .on('blur', () => term.blur())
    .on('render', (win) => createConnection(core, proc, win, term, fit))
    .render(render);
};

//
// Callback for launching application
//
osjs.register(applicationName, (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {
    args,
    options,
    metadata
  });

  proc.on('destroy-window', () => {
    if (!proc.windows.length) {
      proc.destroy();
    }
  });

  const createWindow = () => createTerminal(core, proc, proc.windows.length);

  if (core.has('osjs/tray')) {
    const tray = core.make('osjs/tray').create({
      icon: proc.resource(metadata.icon),
    }, (ev) => {
      core.make('osjs/contextmenu').show({
        position: ev,
        menu: [
          {label: 'New terminal', onclick: () => createWindow()}
        ]
      });
    });

    proc.on('destroy', () => tray.destroy());
  }

  createWindow();

  proc.on('attention', () => createWindow());

  return proc;
});
