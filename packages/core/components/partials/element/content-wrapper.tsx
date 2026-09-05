import React from 'react'
import type { Errors } from 'nitro-web/types'
import { Spinner, twMerge } from 'nitro-web'

interface ContentWrapperProps<T = unknown> {
  children: (data: T) => React.ReactNode
  data?: T
  isLoading?: boolean
  errors?: Errors | null
  loadingMessage?: string
  errorTitle?: string
}

// Owns the loading and error states, so children only render once the data is there
export const ContentWrapper = <T,>({ children, data, isLoading, errors, loadingMessage, errorTitle }: ContentWrapperProps<T>) => {
  return (
    <React.Fragment>
      {
        isLoading
          ? <LoadingBanner loadingMessage={loadingMessage} />
          : (errors && errors.length > 0)
              ? <ErrorBanner errors={errors} errorTitle={errorTitle} />
              : (data ? children(data) : null)
      }
    </React.Fragment>
  )
}

export function ErrorBanner({ errors, errorTitle='Something went wrong', className }: {
  errors?: Errors | null,
  errorTitle?: string,
  className?: string,
}) {
  if (!errors || errors.length === 0) return null
  return (
    <div className={twMerge('p-5 border bg-danger/[0.03] border-danger text-danger-foreground rounded', className)}>
      <h3 className="mb-1 font-semibold">{errorTitle}</h3>
      {errors.map((error, i) => (
        <p key={i}>{error.detail}</p>
      ))}
    </div>
  )
}

export function LoadingBanner({ loadingMessage='One moment...', className }: { loadingMessage?: string, className?: string }) {
  return (
    <div className={`p-8 flex flex-col items-center justify-center gap-4 ${className||''}`}>
      <Spinner className="size-3.5" />
      <p className="font-medium">{loadingMessage}</p>
    </div>
  )
}
