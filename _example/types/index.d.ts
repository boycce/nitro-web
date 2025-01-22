// Shared store
declare global {
  const sharedStore: Record<string, unknown>
}

// Svgs
declare module '*.svg' {
  const content: string | React.FC<React.SVGProps<SVGElement>>
  export default content
}

// Webpack config
declare const CONFIG: Record<string, string>