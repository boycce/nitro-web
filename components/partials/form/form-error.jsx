export function FormError({ state, fields, className }) {
  /**
   * this is a catch all error component that should be placed next to the submit button
   * @param {object} state
   * @param {array} <fields> - display all errors except these field titles, e.g. ['name', 'address']
   */
  for (let item of state.errors || []) {
    if (!item.title || item.title.match(/^(error|invalid)$/i) || (fields && !fields.includes(item.title))) {
      var error = item
    }
  }
  return (
    <>
      {error ? (
        <div class={`text-danger mt-1 text-sm ${className||''}`}>
          {error.detail}
        </div>
      ) : null}
    </>
  )
}
