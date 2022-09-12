#!/usr/bin/env node
import { program } from './program'
import addInitCmd from './cmds/init'
import addLoginCmd from './cmds/login'
import addLinkCmd from './cmds/link'
import addStartCmd from './cmds/start'

addInitCmd(program)
addLoginCmd(program)
addLinkCmd(program)
addStartCmd(program)

program.parse()
