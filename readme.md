# Nitro

[![NPM](https://img.shields.io/npm/v/nitro-web.svg)](https://www.npmjs.com/package/nitro-web)

Nitro is a battle-tested, modular base project to turbocharge your projects, styled using Tailwind 🚀

### Install

```bash
npm i nitro-web
```

### Setup

1. Copy the `./_example` folder to your project
2. In package.json, replace `"nitro-web": "file:.."` with `"nitro-web": "0.0.1"`
3. In tsconfig.json, remove 
```json
    "paths": {
      "nitro-web": [
        "../client/index.js",
      ],
    },
```
4. `npm i`

### Usage

On the client, you can import components and page-components as you would normally. See the example folder for further info.

```javascript
import { SigninPage, Toggle, util } from 'nitro-web'
```

On the server, you can import the express router, default models, and controllers. See the example folder for further info.

```javascript
import { setupRouter, util } from 'nitro-web/server.js'
const server = await setupRouter(config)
server.listen(3001, '0.0.0.0')
```

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

### Versions

- Express `^4.17`
- Monastery `~3.5.1`
- Node `^18`
- React `^18.3`
- Tailwind `^3.4`
- Webpack `^5.92`

### Common packages

- `pdf-to-img`
- `pdfmake`
- `react-chartjs-2`
- `jest: ^29.7.0`
- `migrate-mongo: ^10.0.0`
- `eslint-plugin-jest: ^28.9.0`