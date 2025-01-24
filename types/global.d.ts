// Ambient type declarations

// Store
declare global {
  const sharedStore: Record<string, unknown>
}

// Wepback: Svgs
declare module '*.svg' {
  const content: string | React.FC<React.SVGProps<SVGElement>>
}

// Wepback: Images
declare module '*.jpg' {
  const content: string
}

// Webpack: environment variable
declare const CONFIG: Record<string, string>