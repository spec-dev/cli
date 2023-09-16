#!/usr/bin/env node
import { program } from './program'
import addAddCmd from './cmds/add'
import addCreateCmd from './cmds/create'
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
import addVersionCmd from './cmds/version'
import addGetCmd from './cmds/get'
import addLogoutCmd from './cmds/logout'
import addTailCmd from './cmds/tail'
import addMigrateCmd from './cmds/migrate'

addAddCmd(program)
addCreateCmd(program)
addGetCmd(program)
addNewCmd(program)
addTestCmd(program)
addDBCmd(program)
addMigrateCmd(program)
addLinkCmd(program)
addUseCmd(program)
addShowCmd(program)
addInitCmd(program)
addLoginCmd(program)
addLogoutCmd(program)
addLogsCmd(program)
addOpenCmd(program)
addStartCmd(program)
addTailCmd(program)
addVersionCmd(program)

program.parse()
