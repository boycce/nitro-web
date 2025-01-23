# Nitro

[![NPM](https://img.shields.io/npm/v/nitro-web.svg)](https://www.npmjs.com/package/nitro-web)

Nitro is a battle-tested, modular base project to turbocharge your projects, styled using Tailwind 🚀

```bash
npm i nitro-web
```

### Install

1. Copy ./_example into your project
2. In package.json, replace `"nitro-web": "file:.."` with `"nitro-web": "^0.0.7"`
3. In package.json, replace `"../.eslintrc.json"` with `"./node_modules/nitro-web/.eslintrc.json"`
4. Run `npm i`

### Usage

On the client, you can import components and page-components as you would normally. See ./example for further info.

```javascript
import { SigninPage, Toggle, util } from 'nitro-web'
```

On the server, you can import the express router, default models, and controllers. See ./example for further info.

```javascript
import { setupRouter, util } from 'nitro-web/server'
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

### Package notes

- Added twin.macro is required as a dev dependency to ./. Note that this may cause errors when npm linking nitro-web, since dev deps are not installed.
- Added tailwindcss^3 as a dev dependency to ./ to stop tailwind^4.0.0 from being installed