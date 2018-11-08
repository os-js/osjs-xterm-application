<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) desktop implementation for your browser with a fully-fledged window manager, Application APIs, GUI toolkits and filesystem abstraction.

[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.os-js.org/)
[![Donate](https://img.shields.io/badge/liberapay-donate-yellowgreen.svg)](https://liberapay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=andersevenrud%40gmail%2ecom&lc=NO&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)

# OS.js v3 Xterm Application

This is the Xterm Application for OS.js v3

![Screenshot](https://raw.githubusercontent.com/os-js/osjs-xterm-application/master/screenshot.png)

## Requirements

* `bash`
* `ssh`

## Installation

Install [@osjs/cli](https://npmjs.com/package/@osjs/cli) globally for discovering installed third-party packages and more.

```bash
npm install --global @osjs/cli
```

and then install this package.

```bash
npm install --save @osjs/xterm-application
osjs-cli package:discover
```

# Usage

Start from application menu.

**Note that it will log into a shell with the username you are logged in as.**

If you want to change this behavior, you can add this to your `src/server/config.js` file in the OS.js distribution:

```
{
  xterm: {
    // You can also set this as a string to force a username
    login: false
  }
}
```
