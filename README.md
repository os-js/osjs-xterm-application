<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)
[![Support](https://img.shields.io/badge/opencollective-donate-red.svg)](https://opencollective.com/osjs)
[![Donate](https://img.shields.io/badge/liberapay-donate-yellowgreen.svg)](https://liberapay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://paypal.me/andersevenrud)
[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.os-js.org/)

# OS.js v3 Xterm Application

This is the Xterm Application for OS.js v3

![Screenshot](https://raw.githubusercontent.com/os-js/osjs-xterm-application/master/screenshot.png)

## Requirements

* `bash`
* `ssh`

## Installation

```bash
npm install --save --production @osjs/xterm-application
npm run package:discover
```

# Usage

Start from application menu.

**Note that it will log into a shell with the username you are logged in as.**

If you want to change this behavior, you can add this to your `src/server/config.js` file in the OS.js distribution:

```javascript
{
  xterm: {
    // You can also set this as a string to force a username
    login: false
  }
}
```

You can also change the connection arguments:

```javascript
{
  xterm: {
    ssh: {
      // Custom hostname
      hostname: 'localhost',

      // Custom port
      args: '-p 1022'
    }
  }
}
```

## Contribution

* **Sponsor on [Github](https://github.com/sponsors/andersevenrud)**
* **Become a [Patreon](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)**
* **Support on [Open Collective](https://opencollective.com/osjs)**
* [Contribution Guide](https://github.com/os-js/OS.js/blob/master/CONTRIBUTING.md)

## Documentation

See the [Official Manuals](https://manual.os-js.org/v3/) for articles, tutorials and guides.

## Links

* [Official Chat](https://gitter.im/os-js/OS.js)
* [Community Forums and Announcements](https://community.os-js.org/)
* [Homepage](https://os-js.org/)
* [Twitter](https://twitter.com/osjsorg) ([author](https://twitter.com/andersevenrud))
* [Google+](https://plus.google.com/b/113399210633478618934/113399210633478618934)
* [Facebook](https://www.facebook.com/os.js.org)
* [Docker Hub](https://hub.docker.com/u/osjs/)
