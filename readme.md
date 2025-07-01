# Nitro

[![NPM](https://img.shields.io/npm/v/nitro-web.svg)](https://www.npmjs.com/package/nitro-web)

Nitro is a battle-tested, modular base project to turbocharge your projects, styled using Tailwind and Lucide icons 🚀

```bash
npm i nitro-web -D @nitro-web/webpack
```

### Install

1. Copy ./packages/example into your project
5. Uncomment `# .env` in `./gitignore`  
5. Run `npm i`

### Usage

On the client, you can import components and page-components. See ./packages/example for further info.

```javascript
import { SigninPage, Field } from 'nitro-web'
```

On the server, you can import the express router, default models, and controllers. See ./packages/example for further info.

```javascript
import { setupRouter } from 'nitro-web/server'
const server = await setupRouter(config)
server.listen(3001, '0.0.0.0')
```

On the client/server, you can import common utilities.

```javascript
import { deepCopy } from 'nitro-web/util'
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

### Developing Nitro in a Custom Project

1. Git clone Nitro
1. Move your project into `./packages/MYPROJECT`
2. Delete the `./MYPROJECT/package-lock.json` file (if it exists), and add `package-lock=false` to `./MYPROJECT/.npmrc`. Workspaces only generate a single `package-lock.json` at the root, if this file exists locally, npm may install outdated dependencies for your team or in production.
3. Ensure the same versions of `nitro-web` and `nitro-web/webpack` are used, this is required for workspace linking to function correctly.

### Versions

- Express `^4.17`
- Monastery `~3.5.4`
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
