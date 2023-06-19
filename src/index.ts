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
import addStartCmd from './cmds/start'
import addUpdateCmd from './cmds/update'
import addVersionCmd from './cmds/version'
import addGetCmd from './cmds/get'
import addRegisterCmd from './cmds/register'

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
addStartCmd(program)
addUpdateCmd(program)
addVersionCmd(program)
addGetCmd(program)
addRegisterCmd(program)

program.parse()
