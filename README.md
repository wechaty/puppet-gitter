# Wechaty Puppet Gitter

[![NPM Version](https://badge.fury.io/js/wechaty-puppet-gitter.svg)](https://badge.fury.io/js/wechaty-puppet-gitter)
[![npm (tag)](https://img.shields.io/npm/v/wechaty-puppet-gitter/next.svg)](https://www.npmjs.com/package/wechaty-puppet-gitter?activeTab=versions)
[![NPM](https://github.com/wechaty/wechaty-puppet-gitter/workflows/NPM/badge.svg)](https://github.com/wechaty/wechaty-puppet-gitter/actions?query=workflow%3ANPM)
[![ES Modules](https://img.shields.io/badge/ES-Modules-brightgreen)](https://github.com/Chatie/tsconfig/issues/16)

![wechaty puppet gitter](docs/images/wechaty-puppet-gitter.png)

[![Powered by Wechaty](https://img.shields.io/badge/Powered%20By-Wechaty-brightgreen.svg)](https://github.com/wechaty/wechaty)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Gitter](https://badges.gitter.im/wechaty/wechaty.svg)](https://gitter.im/wechaty/wechaty?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

> Gitter is an open-source instant messaging and chat room system for developers and users of GitLab and GitHub repositories.  
> &dash; [WikiPedia](https://en.wikipedia.org/wiki/Gitter)

Wechaty Puppet for  Gitter: <https://gitter.im>

## Feature

1. Receive and send text messages in Gitter.im rooms.

## USAGE

The `wechaty-puppet-gitter` needs a TOKEN and only one token from gitter so that it can connect to the gitter.im service.

> Learn more about the TOKEN from gitter.im at <https://developer.gitter.im/apps>

You can pass the token to this puppet by putting it into `options`, or by setting the environment variable `WECHATY_PUPPET_GITTER_TOKEN`.

### Puppet Gitter

```ts
import { Wechaty }   from 'wechaty'
import { PuppetGitter } from 'wechaty-puppet-gitter'

/**
 * Personal Access Token: this token can be used to access the Gitter API.
 *  https://developer.gitter.im/apps
 */
const puppet  = new PuppetGitter({ token: 'your_gitter_token' })
const wechaty = new Wechaty({ puppet })

await wechaty.start()
```

### Environment Variable: `WECHATY_PUPPET_GITTER_TOKEN`

The `wechaty-puppet-gitter` will search the environment variable named `WECHATY_PUPPET_GITTER_TOKEN` to get the token if you do not set it in the `options`.

## Resources

1. [Gitter.im Developer Documents](https://developer.gitter.im/docs/welcome)

### GitHub Projects

1. [IRC ⚡ Gitter, https://irc.gitter.im](https://gitlab.com/gitlab-org/gitter/irc-bridge)
1. [Bot that synchronises messages from gitter and irc](https://github.com/finnp/gitter-irc-bot)
1. [Add a Integration feature for IRC (two-way sync between gitter room and a designated IRC channel)](https://gitlab.com/gitlab-org/gitter/webapp/-/issues/662)
1. [Slack API: Enabling interactions with bots](https://api.slack.com/bot-users)
1. [Matrix <-> Gitter bridge](https://github.com/matrix-org/matrix-appservice-gitter)

## HISTORY

### master v1.0 Release

Release v1.0

1. v0.7 (Oct 2021): Upgrade to Puppet v0.51 API
1. v0.5 (Sep 2021): ES Modules support

### v0.4 (Aug 27, 2020)

1. Support send/receive image ([#2](https://github.com/wechaty/wechaty-puppet-gitter/issues/2))

### v0.2 (Aug 21, 2020)

Initial version.

`PuppetGitter` is a Gitter Puppet for <https://gitter.im>

## AUTHOR

[Huan LI](http://linkedin.com/in/zixia) \<zixia@zixia.net\>

<!-- markdownlint-disable MD033 -->
<a href="https://stackexchange.com/users/265499">
  <img src="https://stackexchange.com/users/flair/265499.png" width="208" height="58" alt="profile for zixia on Stack Exchange, a network of free, community-driven Q&amp;A sites" title="profile for zixia on Stack Exchange, a network of free, community-driven Q&amp;A sites">
</a>

## COPYRIGHT & LICENSE

* Code & Docs © 2020-now Huan LI \<zixia@zixia.net\>
* Code released under the Apache-2.0 License
* Docs released under Creative Commons
