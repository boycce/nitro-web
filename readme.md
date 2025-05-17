# Nitro

[![NPM](https://img.shields.io/npm/v/nitro-web.svg)](https://www.npmjs.com/package/nitro-web)

Nitro is a battle-tested, modular base project to turbocharge your projects, styled using Tailwind 🚀

```bash
npm i nitro-web -D @nitro-web/webpack
```

### Install

1. Copy ./example into your project
2. In package.json, replace `"nitro-web": "workspace:*"` with `"nitro-web": "~0.0.33"`
3. In package.json, replace `"@nitro-web/webpack": "workspace:*"` with `"@nitro-web/webpack": "~0.0.33"`
4. In package.json, replace `"../core/.eslintrc.json"` with `"./node_modules/nitro-web/.eslintrc.json"`
5. Uncomment `# .env` in `./gitignore`  
5. Run `npm i`

### Usage

On the client, you can import components and page-components as you would normally. See ./example for further info.

```javascript
import { SigninPage, Field, util } from 'nitro-web'
```

On the server, you can import the express router, default models, and controllers. See ./example for further info.

```javascript
import { setupRouter, util } from 'nitro-web/server'
const server = await setupRouter(config)
server.listen(3001, '0.0.0.0')
```

### Run

```bash
# Running in development (watching for changes)
npm run dev:server # run and watch the nodemon server
npm run dev:client # run and watch the webpack dev server
npm run dev # or run and watch both the server and client

# Building for production
npm run build
npm run start
```

### Nitro Development

The same run commands can be used in ./ which are actually executed in ./example/ via npm workspaces (`-w` flag).

If util.js is updated, you must run `npm run types` to update the types file.

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
