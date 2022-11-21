#!/usr/bin/env node
import { program } from './program'
import addShowCmd from './cmds/show'
import addUseCmd from './cmds/use'
import addInitCmd from './cmds/init'
import addLoginCmd from './cmds/login'
import addStartCmd from './cmds/start'
import addStopCmd from './cmds/stop'
import addLogsCmd from './cmds/logs'

addShowCmd(program)
addUseCmd(program)
addInitCmd(program)
addLoginCmd(program)
addStartCmd(program)
addStopCmd(program)
addLogsCmd(program)

program.parse()
