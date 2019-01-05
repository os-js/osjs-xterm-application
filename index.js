/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2019, Anders Evenrud <andersevenrud@gmail.com>
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

import './index.scss';
import {Terminal} from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as attach from 'xterm/lib/addons/attach/attach';
import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

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

  const response = await proc.request('/create', {method: 'post', body: params});
  const ws = proc.socket();
  const uuid = response.uuid;
  let pinged = false;
  let pid = -1;

  ws.on('open', () => ws.send(uuid));

  ws.on('message', (ev) => {
    if (!pinged) {
      pinged = true;
      pid = parseInt(ev.data, 10);
      term.attach(ws.connection);
    }
  });

  term.on('resize', (size) => {
    const {cols, rows} = size;
    proc.request('/resize', {method: 'post', body: {size: {cols, rows}, pid, uuid}});
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
    term.focus();
  };

  proc.createWindow({
    id: 'Xterm_' + String(index),
    title: proc.metadata.title.en_EN,
    icon: proc.resource(proc.metadata.icon),
    dimension: {width: 960, height: 288}
  })
    .on('resized', fit)
    .on('maximize', fit)
    .on('restore', fit)
    .on('moved', () => term.focus())
    .on('focus', () => term.focus())
    .on('blur', () => term.blur())
    .on('render', (win) => {
      createConnection(core, proc, win, term);
      win.focus();
    })
    .render(render);
};

//
// Callback for launching application
//
osjs.register(applicationName, (core, args, options, metadata) => {
  Terminal.applyAddon(fit);
  Terminal.applyAddon(attach);

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
