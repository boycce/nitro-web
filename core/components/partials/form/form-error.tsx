import { Errors } from 'nitro-web/types'

type FormError = {
  state: { errors: Errors },
  // display all errors except these field titles, e.g. ['name', 'address']
  fields?: Array<string>,
  className?: string,
}

export function FormError({ state, fields, className }: FormError) {
  // A catch all error element that should be placed next to the submit button
  let error: { title: string, detail: string } | undefined
  for (const item of state.errors || []) {
    if (!item.title || item.title.match(/^(error|invalid)$/i) || (fields && !fields.includes(item.title))) {
      error = item
    }
  }
  return (
    <>
      {error ? (
        <div class={`text-danger mt-1 text-sm nitro-error ${className||''}`}>
          {error.detail}
        </div>
      ) : null}
    </>
  )
}
