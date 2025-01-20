
/**
 * Checkbox/radio/toggle component
 * @param {string} name - The name of the checkbox
 * @param {string} [id] - The id of the checkbox (used for radios)
 * @param {'sm' | 'md'} [size='sm'] - The size of the toggle
 * @param {string} [subtext] 
 * @param {string} [text] 
 * @param {'checkbox' | 'radio' | 'toggle'} [type='checkbox']
 * @param {object} [props] - input props
 * 
 * @link https://tailwindui.com/components/application-ui/forms/checkboxes#component-744ed4fa65ba36b925701eb4da5c6e31
 */
export function Checkbox({ name, id, size='sm', subtext, text, type='checkbox', ...props }) {
  if (!name) throw new Error('Checkbox requires a `name` prop')
  id = id || name
  return (
    <div className={`mt-input-before mb-input-after flex gap-3 ${props.className || ''}`}>
      <div className="flex h-6 shrink-0 items-center">
        {
          type !== 'toggle'
          ? <div className="group grid size-4 grid-cols-1">
              <input
                {...props}
                id={id}
                name={name}
                type={type}
                className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
              />
              <svg
                fill="none"
                viewBox="0 0 14 14"
                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
              >
                <path
                  d="M3 8L6 11L11 3.5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-0 group-has-[:checked]:opacity-100"
                />
                <path
                  d="M3 7H11"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-0 group-has-[:indeterminate]:opacity-100"
                />
              </svg>
            </div>
          : <div className="group grid grid-cols-1">
              <input 
                {...props}
                id={id}
                name={name}
                type="checkbox" 
                class="sr-only peer"
              />
              <label 
                for={id}
                className={`col-start-1 row-start-1 relative ${size == 'sm' ? 'w-9' : 'w-11'} ${size == 'sm' ? 'h-5' : 'h-6'} bg-gray-200 peer-focus-visible:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-blue-300 dark:peer-focus-visible:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full ${size == 'sm' ? 'after:w-4' : 'after:w-5'} ${size == 'sm' ? 'after:h-4' : 'after:h-5'} after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}
              />
            </div>
        }
      </div>
      {text && <div className="text-sm/6">
        <label for={id} className="select-none">
          <span className="font-medium text-gray-900">{text}</span>
          <span className="ml-2 text-gray-500">{subtext}</span>
        </label>
      </div>}
    </div>
  )
}
