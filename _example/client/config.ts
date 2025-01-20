declare const CONFIG: Record<string, any>
const config = {}
Object.assign(config, CONFIG) // Injected environment variables from webpack

export default config
