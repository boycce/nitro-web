import { Spinner, twMerge } from 'nitro-web'

export function LoadingWithDots({ message='Loading', className, classNameDots }: { 
  message?: string, 
  className?: string, 
  classNameDots?: string 
}) {
  return (
    <span className={`flex items-center gap-[0.2em] ${className}`}>
      {message}<span className={twMerge('relative loading-dots', classNameDots)} />
    </span> 
  )
}

export function LoadingOverlay({ message='Loading', className }: { message?: string, className?: string }) {
  return (
    <div 
      className={twMerge('absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 text-md [&>span]:bg-white', className)}
    >
      <span className="inline-block flex items-center justify-center gap-3 p-2">
        <Spinner />{message}
      </span>
    </div>
  )
}