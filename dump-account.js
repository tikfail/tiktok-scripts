/* eslint-disable camelcase */
require('dotenv').config({ path: '.env' })
const fs = require('fs')
const path = require('path')
const axios = require('axios')

// const Signer = require('./lib/signer')

const { downloadMedia, sleep } = require('./lib/utils')

const UA = process.env.USERAGENT
const COOKIES = process.env.COOKIES

const precheck = async (username) => {
  if (!COOKIES) {
    console.log('[warn] No cookies have been supplied')
    console.log('[warn] Press Ctrl+C and edit .env if you need cookies')
    await sleep(3)
  }

  if (!fs.existsSync(path.join(__dirname, 'downloads/'))) fs.mkdirSync(path.join(__dirname, 'downloads/'))
  if (!fs.existsSync(path.join(__dirname, `downloads/${username}/`))) fs.mkdirSync(path.join(__dirname, `downloads/${username}/`))
}

const dumpUserPosts = async (username, cursor = 0) => {
  // const signer = new Signer(UA)
  let secuid = username

  if (cursor === 0) {
    cursor = new Date().getTime()
    precheck(username)
  }

  // eslint-disable-next-line no-negated-condition
  if (!username.startsWith('MS4wLjABAAAA')) {
    const userAxiosConfig = {
      method: 'GET',
      url: `https://api.tik.fail/v2/search/user?q=${username}`,
      headers: {
        'User-Agent': 'TikTokScripts/dump-user (https://github.com/tikfail/tiktok-scripts)'
      },
      responseType: 'json',
      responseEncoding: 'utf8'
    }
    const { data } = await axios(userAxiosConfig)
    const meta = data.data[0]
    secuid = meta.sec_uid
    console.log(meta)

    if (!data.success || !secuid.startsWith('MS4wLjABAAAA')) {
      console.log('[error] Couldn\'t get user sec_uid')
      console.log(meta)
      process.exit(1)
    }
  }

  const tiktokAxiosConfig = {
    method: 'GET',
    url: 'https://www.tiktok.com/api/creator/item_list/',
    headers: {
      'Origin': 'https://www.tiktok.com',
      'User-Agent': UA,
      'Cookie': COOKIES
    },
    params: {
      aid: 1988,
      count: 15,
      cursor: cursor,
      secUid: secuid,
      type: 1,
      verifyFp: 'verify_'
    },  
    responseType: 'json',
    responseEncoding: 'utf8'
  }

  const { data } = await axios(tiktokAxiosConfig)

  if (!data.itemList) {
    console.log(`[warn] Got hasMore but itemList is empty | ${cursor}`)
    console.log(data)
    return process.exit(1)
  }

  const total = data.itemList.length
  const nextCursor = Math.floor(Number(data.itemList.at(-1).createTime) * 1000)

  console.log(`[----] Got ${total} Total Items | hasMore: ${data.hasMorePrevious}`)

  for (let i = 0; i < total; ++i) {
    const v = data.itemList[i]
    const vid = v.id

    // Write Metadata
    fs.writeFileSync(path.join(__dirname, `downloads/${v.author.uniqueId}/${vid}.json`), JSON.stringify(v, null, 2))

    // Slideshows
    if (v.imagePost) {
      const totalImages = v.imagePost.images.length
      for (let img = 0; img < totalImages; img++) {
        const image = v.imagePost.images[img].imageURL.urlList[0]
        await downloadMedia(image, `downloads/${v.author.uniqueId}/${vid}-${String(img + 1).padStart(2, '0')}.jpg`, COOKIES)
      }
      console.log(`[image] ${vid} - ${totalImages} Images`)
      continue
    }

    // Video
    try {
      await downloadMedia(v.video.playAddr, `downloads/${v.author.uniqueId}/${vid}.mp4`, COOKIES)
      console.log(`[video] ${vid}`)
    } catch (error) {
      console.log(`[error] Failed to download video: ${vid}`)
      console.log(error)
    }

    // Video Thumbnails
    if (process.env.THUMBNAILS) {
      await downloadMedia(v.video.dynamicCover, `downloads/${v.author.uniqueId}/${vid}.webp`, COOKIES)
      await downloadMedia(v.video.cover, `downloads/${v.author.uniqueId}/${vid}.jpg`, COOKIES)
    }
  }


  if (data.hasMorePrevious) {
    console.log(`=========================[ Cursor: ${cursor} --> ${nextCursor} | hasMore: ${data.hasMorePrevious} ]=========================`)
    return dumpUserPosts(secuid, nextCursor)
  }

  console.log('[info] Done')
  return process.exit(0)
}

if (require.main === module) {
  if (process.argv[2]) {
    dumpUserPosts(process.argv[2])
  } else {
    console.log('[error] Usage: node dump-account.sh <username>')
  }
}
