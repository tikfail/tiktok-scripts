# TikTok Scripts

- Scripts require `Node.js`
  - Install from [nodejs.org](https://nodejs.org/en/download)
  - OR Install with [Volta (A modern NVM alternative)](https://volta.sh/)

---
## Download Private Accounts

- Move `.env.example` to `.env`
- Edit the `COOKIES` & `USERAGENT` values in `.env`
  - `COOKIES`: The cookies from your account which follows the private user
  - `USERAGENT`: The 'User-Agent' of the browser thats logged into the account
- Run `dump-account.js`
  - Usage: `node dump-account.js <username>`
  - Example: `node dump-account.js poki`
- Media (Videos & Images) and Metadata will be saved to `./downloads/username/` using the video ID
