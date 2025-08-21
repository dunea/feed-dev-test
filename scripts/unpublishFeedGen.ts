import dotenv from 'dotenv'
import { AtpAgent, BlobRef } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'
import inquirer from 'inquirer'

const run = async () => {
  dotenv.config()
  
  const answers = await inquirer
    .prompt([
      {
        type: 'input',
        name: 'handle',
        message: '请输入您的“蓝天”账号名',
        required: true,
      },
      {
        type: 'password',
        name: 'password',
        message: '请输入您的“蓝天”账号密码（建议使用应用程序密码）:',
      },
      {
        type: 'input',
        name: 'service',
        message: '（可选）也可以输入自定义的 PDS 服务来进行登录。:',
        default: 'https://bsky.social',
        required: false,
      },
      {
        type: 'input',
        name: 'recordName',
        message: '请输入您要删除的记录的简称:',
        required: true,
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: '您确定要删除这条记录吗？这样您信息流中的所有点赞都会丢失。:',
        default: false,
      },
    ])
  
  const { handle, password, recordName, service, confirm } = answers
  
  if (!confirm) {
    console.log('Aborting...')
    return
  }
  
  // 只有在测试环境中才需要进行此项更新。
  const agent = new AtpAgent({ service: service ? service : 'https://bsky.social' })
  await agent.login({ identifier: handle, password })
  
  await agent.api.com.atproto.repo.deleteRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: recordName,
  })
  
  console.log('全部完成 🎉')
}

run()
  .catch((err) => {
    console.error(err)
  })
