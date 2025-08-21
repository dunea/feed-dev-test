import dotenv from 'dotenv'
import inquirer from 'inquirer'
import { AtpAgent, BlobRef, AppBskyFeedDefs } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'

const run = async () => {
  dotenv.config()
  
  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    throw new Error('Please provide a hostname in the .env file')
  }
  
  const answers = await inquirer
    .prompt([
      {
        type: 'input',
        name: 'handle',
        message: '输入您的 Bluesky 用户名:',
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
        message: '输入一个简短的名称或记录内容。这将会显示在该信息流的网址中。:',
        required: true,
      },
      {
        type: 'input',
        name: 'displayName',
        message: '为您的信息流输入一个显示名称:',
        required: true,
      },
      {
        type: 'input',
        name: 'description',
        message: '（可选）请简要描述您的订阅内容。:',
        required: false,
      },
      {
        type: 'input',
        name: 'avatar',
        message: '（可选）输入一个本地路径，指向将用于该动态图的虚拟形象。:',
        required: false,
      },
      {
        type: 'confirm',
        name: 'videoOnly',
        message: '这是仅播放视频的流媒体吗？如果是这样，您是否想要将内容模式设置为视频模式？这样就能在应用程序中获得“沉浸式”的视频体验了。',
        default: false,
      },
    ])
  
  const { handle, password, recordName, displayName, description, avatar, service, videoOnly } = answers
  
  const feedGenDid =
    process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`
  
  // 只有在测试环境中才需要进行此项更新。
  const agent = new AtpAgent({ service: service ? service : 'https://bsky.social' })
  await agent.login({ identifier: handle, password })
  
  let avatarRef: BlobRef | undefined
  if (avatar) {
    let encoding: string
    if (avatar.endsWith('png')) {
      encoding = 'image/png'
    } else if (avatar.endsWith('jpg') || avatar.endsWith('jpeg')) {
      encoding = 'image/jpeg'
    } else {
      throw new Error('预期的 png 格式或 jpeg 格式文件')
    }
    const img = await fs.readFile(avatar)
    const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, {
      encoding,
    })
    avatarRef = blobRes.data.blob
  }
  
  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: recordName,
    record: {
      did: feedGenDid,
      displayName: displayName,
      description: description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
      contentMode: videoOnly ? AppBskyFeedDefs.CONTENTMODEVIDEO : AppBskyFeedDefs.CONTENTMODEUNSPECIFIED,
    },
  })
  
  console.log('全部完成 🎉')
}

run()
  .catch((err) => {
    console.error(err)
  })
