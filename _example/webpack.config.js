import config from './server/config.js'
import { getWebpackConfig } from '#nitro-web/webpack.config.js'

export default getWebpackConfig(config)