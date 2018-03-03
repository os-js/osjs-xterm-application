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

import Terminal from 'xterm';

/*
 * Creates a new Terminal connection
 */
const createConnection = async (core, proc, win, term) => {
  const params = {
    connection: {
    },
    size: {
      cols: term.cols,
      rows: term.rows
    }
  };

  term.fit();
  term.clear();
  term.writeln('Requesting connection....');

  const response = await proc.request('/create', params);
  const ws = proc.socket();
  let pinged = false;
  let pid = -1;

  ws.onopen = () => ws.send(response.uuid);

  ws.onmessage = (ev) => {
    if ( !pinged ) {
      pinged = true;
      pid = parseInt(ev.data, 10);
      term.attach(ws);
    }
  };

  term.on('resize', (size) => {
    const {cols, rows} = size;
    proc.request('/resize', {size: {cols, rows}, pid});
  });

  win.on('destroy', () => ws.close());
};

/*
 * Creates a new Terminal and Window
 */
const createTerminal = (core, proc, index) => {
  const term = new Terminal();

  const fit = () => {
    setTimeout(() => {
      term.fit();
      term.focus();
    }, 100);
  };

  const render = ($content) => {
    term.open($content);
    term.fit();
  };

  proc.createWindow({
    id: 'Xterm_' + String(index),
    title: proc.metadata.title.en_EN,
    state: {
      dimension: {width: 400, height: 400},
      position: {left: 700, top: 200}
    }
  })
    .on('resized', fit)
    .on('maximize', fit)
    .on('restore', fit)
    .on('moved', () => term.focus())
    .on('focus', () => term.focus())
    .on('blur', () => term.blur())
    .on('render', (win) => createConnection(core, proc, win, term))
    .render(render);
};

//
// Callback for launching application
//
OSjs.make('osjs/packages').register('Xterm', (core, args, options, metadata) => {
  Terminal.loadAddon('fit');
  Terminal.loadAddon('attach');

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

  createTerminal(core, proc, proc.windows.length);

  return proc;
});
