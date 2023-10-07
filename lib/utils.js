const fs = require('fs')
const path = require('path')
const axios = require('axios')

exports.downloadMedia = async (url, savePath, cookies = '') => {
  const response = await axios.get(url, {
    headers: {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Range': 'bytes=0-',
      'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="114"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'video',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Cookie': cookies,
      'Referer': 'https://www.tiktok.com/',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    responseType: 'stream',
  })

  const filePath = path.join(__dirname, `./../${savePath}`)

  const writer = fs.createWriteStream(filePath)
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

exports.sleep = (sec = 1) => {
  return new Promise(resolve => {
    return setTimeout(resolve, sec * 1000)
  })
}
