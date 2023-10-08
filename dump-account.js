/* eslint-disable camelcase */
require('dotenv').config({ path: '.env' })
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const Signer = require('./lib/signer')

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
  const signer = new Signer(UA)
  let secuid = username

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
    const userMetadata = await axios(userAxiosConfig)
    const meta = userMetadata.data[0]
    secuid = meta.sec_uid
    console.log(meta)

    if (!userMetadata.data.success || !secuid.startsWith('MS4wLjABAAAA')) {
      console.log('[error] Couldn\'t get user sec_uid')
      process.exit(1)
    }
  }

  const baseURL = 'https://www.tiktok.com/api/post/item_list/'
  const params = {
    WebIdLastTime: Math.floor(new Date().getTime() / 1000),
    secUid: secuid,
    cursor: cursor,
    count: 35,
    aid: 1988,
    app_language: 'en',
    app_name: 'tiktok_web',
    browser_language: 'en-US',
    browser_name: 'Mozilla',
    browser_online: 'true',
    browser_platform: 'Win32',
    browser_version: UA,
    channel: 'tiktok_web',
    cookie_enabled: 'true',
    device_id: '7240013366175843187',
    device_platform: 'web_pc',
    focus_state: 'true',
    from_page: 'user',
    history_len: 2,
    is_fullscreen: 'false',
    is_page_visible: 'true',
    language: 'en',
    os: 'windows',
    priority_region: 'US',
    referer: '',
    region: 'US',
    screen_height: 1080,
    screen_width: 1920,
    tz_name: 'America/Phoenix',
    webcast_language: 'en'
  }

  const unsignedURL = baseURL + '?' + new URLSearchParams(params).toString()
  const signedData = signer.sign(unsignedURL)

  const tiktokAxiosConfig = {
    method: 'GET',
    url: signedData.signed_url,
    headers: {
      'Origin': 'https://www.tiktok.com',
      'X-TT-Params': signedData['x-tt-params'],
      'User-Agent': UA,
      'Cookie': COOKIES
    },
    responseType: 'json',
    responseEncoding: 'utf8'
  }

  const { data } = await axios(tiktokAxiosConfig)

  if (!data.itemList) {
    console.log(`[warn] Got hasMore but itemList is empty | ${cursor}`)
    return process.exit(1)
  }

  const total = data.itemList.length
  console.log(`[----] Got ${total} Total Items | hasMore: ${data.hasMore}`)

  if (cursor === 0) precheck(username)

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

  if (data.hasMore) {
    console.log(`=========================[ Cursor: ${cursor} --> ${data.cursor} | hasMore: ${data.hasMore} ]=========================`)
    return dumpUserPosts(secuid, data.cursor)
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
