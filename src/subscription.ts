import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    
    const ops = await getOpsByType(evt)
    
    // 这将记录所有从 firehose 接收到的帖子的文本内容。
    // 仅供娱乐 :)
    // 实际使用前请删除
    for (const post of ops.posts.creates) {
      console.log(post.record.text)
    }
    
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // 只有与阿尔夫有关的帖子
        return create.record.text.toLowerCase().includes('alf')
      })
      .map((create) => {
        // 将与阿尔法相关的帖子映射到数据库行中
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })
    
    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
