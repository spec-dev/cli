#!/usr/bin/env node
import { program } from './program'
import addDBCmd from './cmds/db'
import addLinkCmd from './cmds/link'
import addNewCmd from './cmds/new'
import addShowCmd from './cmds/show'
import addTestCmd from './cmds/test'
import addUseCmd from './cmds/use'
import addInitCmd from './cmds/init'
import addLoginCmd from './cmds/login'
import addLogsCmd from './cmds/logs'
import addOpenCmd from './cmds/open'
import addUpdateCmd from './cmds/update'
import addVersionCmd from './cmds/version'

addDBCmd(program)
addLinkCmd(program)
addNewCmd(program)
addShowCmd(program)
addTestCmd(program)
addUseCmd(program)
addInitCmd(program)
addLoginCmd(program)
addLogsCmd(program)
addOpenCmd(program)
addUpdateCmd(program)
addVersionCmd(program)

program.parse()
