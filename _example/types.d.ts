declare module '*.svg' {
  const content: string | React.FC<React.SVGProps<SVGElement>>
  export default content
}
declare global {
  const sharedStore: any
}