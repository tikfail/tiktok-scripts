# TikTok Scripts

## Environment Setup
- Scripts require `Node.js` (Tested with `LTS v18.18.0`)
  - Install from [nodejs.org](https://nodejs.org/en/download)
  - OR Install with [Volta (A modern NVM alternative)](https://volta.sh/)
- Install dependencies with `npm` or `yarn`
  - `npm install`
- Proceed to run scripts
---
## Download Private Accounts

- Move `.env.example` to `.env`
- Edit the values in `.env`
  - `COOKIES`: The cookies from your account which follows the private user
  - `USERAGENT`: The 'User-Agent' of the browser thats logged into the account
  - `THUMBNAILS`: Download the default and animated thumbnails for videos
- Run `dump-account.js`
  - Usage: `node dump-account.js <username>`
  - Example: `node dump-account.js poki`
- Media (Videos & Images) and Metadata will be saved to `./downloads/username/` using the video ID
