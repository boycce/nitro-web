# Nitro Web

[![NPM](https://img.shields.io/npm/v/nitro-web.svg)](https://www.npmjs.com/package/nitro-web) [![Build Status](https://travis-ci.com/boycce/nitro-web.svg?branch=master)](https://app.travis-ci.com/github/boycce/nitro-web)

Nitro is a modular React/Express base project, styled using Tailwind 🚀.

### Uses

- Express `^4.17`
- Monastery `~3.5.1`
- React `^18.3`
- Tailwind `^3.4`
- Webpack `^5.92`

### Setup

1. Copy the `_example` folder to your project
2. Copy over package.json
3. In package.json, search and replace `/_example` with `./`
4. In package.json, replace `"#nitro-web/*": { "default": "./*" }` with `{ "default": "nitro-web/*" }`
5. Run `npm i`

### Running in development

```bash
npm run dev:server # run and watch the nodemon server
npm run dev:client # run and watch the webpack dev server

npm run dev # or, run and watch both server and client
```

### Building for production

```bash
npm run build
npm run start
```
