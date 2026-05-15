import { twMerge } from 'nitro-web/util'

export function NotFound({ className }: { className?: string }) {
  return (
    <div className={twMerge('min-h-[300px]', className)}>
      <span class="h1">Page Not Found</span><br />
      <br />
      The page you&apos;re looking for doesn&apos;t exist or has moved.<br />
      <br />
      <Link to="/">Go back home</Link> or check the URL and try again.
    </div>
  )
}