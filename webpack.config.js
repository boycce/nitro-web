import axios from '@hokify/axios'
import axiosRetry from 'axios-retry'
import autoprefixer from 'autoprefixer'
import CleanTerminalPlugin from 'clean-terminal-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import webpackNodeExternals from 'webpack-node-externals'
import path from 'path'
// import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import tailwindcss from 'tailwindcss'
import webpack from 'webpack'
import ESLintPlugin from 'eslint-webpack-plugin'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssFor from 'postcss-for'
import { createRequire } from 'module'
import { getDirectories } from './util.js'

const _require = createRequire(import.meta.url)
const pick = (object, list) => list.reduce((o, e) => ((o[e] = object[e]), o), {})
const isBuild = process.env.NODE_ENV == 'production'

axiosRetry(axios, {
  retries: 10,
  retryDelay: () => 150,
  retryCondition: (e) =>  e.code == 'ECONNREFUSED',
})

// process.traceDeprecation = true
export const getConfig = (config) => {
  const { clientDir, componentsDir, distDir, imgsDir, fontsDir } = getDirectories(path, config.pwd)

  return (env, argv) => [{
    devtool: isBuild ? false : 'source-map',
    entry: clientDir + 'index.ts',
    // entry: isBuild ? './client/index.tsx' : ['webpack-plugin-serve/client', './client/index.tsx'], // check this
    mode: isBuild ? 'production' : 'development',
    // target=node ignores node_modules
    externals: argv.target?.[0] == 'node' ? [webpackNodeExternals()] : [],
    // target=node  ignores builtin modules
    target: argv.target?.[0] || 'web', 
    devServer: {
      // needed when connecting to the devserver through a domain
      allowedHosts: 'all', 
      client: {
        logging: 'warn', // 'info'
        overlay: true,
      },
      compress: false,
      devMiddleware: {
        writeToDisk: false,
      },
      historyApiFallback: true,
      host: '0.0.0.0',
      hot: true,
      port: 3000,
      proxy: {
        '/api': {
          logLevel: 'silent',
          target: 'http://0.0.0.0:3001',
          // bypass: async function (req, res, proxyOptions) {
          //   // // wait for pong, indicating express has restarted
          //   // // all non-asset routes are triggered (even the main page)
          //   // // another method: https://codeburst.io/dont-use-nodemon-there-are-better-ways-fc016b50b45e
          //   // if (!req.url.match(/^\/api\//)) return
          //   // await axios.get('http://0.0.0.0:3001/ping')
          // },
        },
        '/server/email/templates': {
          logLevel: 'silent',
          target: 'http://0.0.0.0:3001',
        },
      },
    },
    infrastructureLogging: {
      level: 'info',
      // debug: [(name) => !name.match(/webpack-dev-server/)],
      // console: (a, b, c) => { // webpack v5.3.1
      //   console.log(1, a, b, c)
      // },
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader', options: { sourceMap: true } },
            { loader: 'postcss-loader', options: {
              postcssOptions: {
                plugins: [
                  postcssImport,
                  // postcssImport({ 
                  //   resolve: postcssImportResolver({
                  //     alias: { 
                  //       'nitro-web/client/css/components.css': path.resolve(nitroDir, 'client/css/components.css'),
                  //       'nitro-web/client/css/fonts.css': path.resolve(nitroDir, 'client/css/fonts.css'),
                  //     },
                  //   }),
                  // }),
                  postcssNested,
                  postcssFor,
                  tailwindcss({ config: path.resolve(config.pwd, 'tailwind.config.js') }), 
                  autoprefixer,
                ],
              },
              sourceMap: true,
            }},
          ],
        },
        {
          test: /\.(m?js|jsx|ts|tsx)$/,
          exclude: (
            (path) => {
              // Dont transpile node modules except for date-fns, which uses ES6
              return path.includes('node_modules') 
                && !path.includes('node_modules/date-fns')
                && !path.includes('node_modules/nitro-web')
            }
          ),
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { debug: false }],
                  ['@babel/preset-typescript', { allowNamespaces: true }],
                  ['@babel/preset-react', { runtime: 'automatic', importSource: '@emotion/react', development: !isBuild }],
                ],
                plugins: [
                  'react-html-attrs',
                  '@babel/plugin-syntax-dynamic-import',
                  '@babel/plugin-transform-runtime',
                  '@emotion/babel-plugin',
                  // Below allows us to reference tailwindcss theme variables in emotion blocks
                  // https://github.com/ben-rogerson/twin.macro/blob/master/docs/options.md
                  // https://medium.com/fredwong-it/emotion-tailwind-twin-macro-7fdc5f2ae5f9
                  // https://github.com/ben-rogerson/twin.examples/tree/master/react-emotion-typescript#complete-the-typescript-setup
                  ['babel-plugin-macros', {
                    'twin': {
                      preset: 'emotion',
                      config: path.resolve(config.pwd, 'tailwind.config.js'),
                    },
                  }],
                  // 'react-refresh/babel', // !isBuild && _require.resolve('react-refresh/babel'),
                ].filter(Boolean),
              },
            },
          ],
        },
        {
          // Workaround to hide emotion's pseudo console noise (bug)
          // https://github.com/emotion-js/emotion/issues/1105#issuecomment-547247291
          test: /node_modules\/@emotion\/cache\/(src|dist)/,
          loader: 'string-replace-loader',
          options: {
            search: 'if (unsafePseudoClasses',
            replace: 'if (false && unsafePseudoClasses',
          },
        },
        {
          test: /styleguide\.html$/i,
          exclude: [/\/server\/email/],
          loader: 'html-loader',
        },
        {
          test: /\.csv$/,
          use: [
            {
              loader: 'csv-loader',
              options: {
                delimiter: ',',
                header: true,
                skipEmptyLines: true,
              },
            },
          ],
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                svgoConfig: {
                  plugins: [
                    {
                      name: 'preset-default',
                      params: {
                        overrides: {
                          removeViewBox: false,
                          convertPathData: false,
                          cleanupNumericValues: false,
                          convertShapeToPath: false,
                        },
                      },
                    },
                    // {
                    //   name: 'addClassesToSVGElement',
                    //   params: {
                    //     className: (node, info) => { 
                    //       console.log(info)
                    //       return `svg-${info?.path?.split('.')[0]}`
                    //     },
                    //   },
                    // },
                    {
                      // until svgr updated to svgo@4 for addClassesToSVGElement fns support
                      name: 'add-data-id-to-svg-icons',
                      fn: (root, _params, info) => {
                        const { basename } = info.path.match(/.*\/(?<basename>.*)\.svg$/).groups
                        if (root.children[0].name === 'svg') {
                          root.children[0].attributes.className = `svg-${basename}`
                        }
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    output: {
      // devtoolModuleFilenameTemplate: (info) => {
      //   // DevTools doesn't link webpack:// sourcemap filepaths, force file://.
      //   let path = 'file://' + encodeURI(info.absoluteResourcePath)
      //   // React only: append ?2 to all paths so devtools can link to the CSS-in-JS
      //   if (path.match(/\.jsx$/)) return path + '?2' 
      //   // Vue only: fix Vue:CSS paths
      //   else return path.replace(/(\/components\/).*?components\//, '$1')
      // },
      // We are outputing assets into a handy subdir to allow for easier asset cache control. We can't
      // simply use `path` because webpack-dev-server won't work when writeFiles=false (in memory).
      // Because of this we manually need to prefix all output filenames with `assets/`.
      filename: `assets/bundle.[name]${isBuild ? '.[contenthash]' : ''}.js`,
      path: distDir,
      publicPath: '/',
    },
    performance: {
      hints: false,
    },
    optimization: {
      // Split chunks into seperate emitted assets
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/].*\.js/,
            name: 'vendor',
            chunks: 'all',
          },
        },
      },
      minimize: isBuild,
    },
    plugins: [
      // new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)(),
      new CopyWebpackPlugin({
        patterns: [
          { from: imgsDir + 'favicon.png', to: './favicon.png' },
          { from: imgsDir, to: './assets/imgs' },
          { from: fontsDir, to: './assets/fonts' },
        ],
      }),
      new webpack.DefinePlugin({
        CONFIG: JSON.stringify({
          ...pick(config, config.inject ? config.inject.split(' ') : []),
          version: config.version,
        }),
      }),
      new ESLintPlugin({
        extensions: ['js', 'mjs', 'jsx'],
        exclude: ['node_modules'],
      }),
      new MiniCssExtractPlugin({ filename: `assets/bundle.[name]${isBuild ? '.[contenthash]' : ''}.css` }),
      new HtmlWebpackPlugin({ template: clientDir + 'index.html', filename: distDir + 'index.html' }),
      new CleanTerminalPlugin({ skipFirstRun: true }),
      // !isBuild && new ReactRefreshWebpackPlugin({ overlay: false }),
    ].filter(Boolean),
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      // fallback: { fs: false },
      alias: {
        // required for auto-importing page components into nitro app.js router
        'componentsDir': componentsDir,
      },
    },
    stats: {
      all: false,
      assets: !process.env.WEBPACK_SERVE,
      errors: true,
      errorDetails: true,
      timings: !process.env.WEBPACK_SERVE,
      warnings: true,
    },
    watchOptions: {
      aggregateTimeout: 50,
      ignored: new RegExp(`(${componentsDir}.*\\.api\\.js$|node_modules/(?!cherry))`),
    },
  }]
}
