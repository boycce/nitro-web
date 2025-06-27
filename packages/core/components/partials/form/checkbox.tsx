import { twMerge } from 'nitro-web/util'

type CheckboxProps = {  
  name: string
  /** name is applied if not provided. Used for radios */
  id?: string 
  size?: 'md' | 'sm'
  subtext?: string|React.ReactNode
  text?: string|React.ReactNode
  type?: 'checkbox' | 'radio' | 'toggle'
  [key: string]: unknown
}

export function Checkbox({ name, id, size='sm', subtext, text, type='checkbox', ...props }: CheckboxProps) {
  // Checkbox/radio/toggle component
  // https://tailwindui.com/components/application-ui/forms/checkboxes#component-744ed4fa65ba36b925701eb4da5c6e31
  if (!name) throw new Error('Checkbox requires a `name` prop')
  id = id || name

  const sizeMap = {
    sm: {
      checkbox: 'size-[14px]',
      toggleWidth: 'w-[32px]', // 4px border + (toggleAfterSize * 2)
      toggleHeight: 'h-[18px]',
      toggleAfterSize: 'after:size-[14px]', // account for 2px border
    },
    md: {
      checkbox: 'size-[16px]',
      toggleWidth: 'w-[40px]', // 4px border + (toggleAfterSize * 2)
      toggleHeight: 'h-[22px]',
      toggleAfterSize: 'after:size-[18px]', // account for 2px border
    },
  }
  const _size = sizeMap[size]

  return (
    <div className={'mt-2.5 mb-6 ' + twMerge(`mt-input-before mb-input-after flex gap-3 nitro-checkbox ${props.className || ''}`)}>
      <div className="flex shrink-0 mt-[2px]">
        {
          type !== 'toggle'
            ? <div className={`group grid ${_size.checkbox} grid-cols-1`}>
                <input
                  {...props}
                  id={id}
                  name={name}
                  type={type}
                  className={
                    `${type === 'radio' ? 'rounded-full' : 'rounded'} col-start-1 row-start-1 appearance-none border border-gray-300 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto ` + 
                    // Default
                    'checked:border-blue-600 checked:bg-blue-600 indeterminate:border-blue-600 indeterminate:bg-blue-600 focus-visible:outline-blue-600 ' +
                    // Variable-selected color defined?
                    'checked:!border-variable-selected checked:!bg-variable-selected indeterminate:!border-variable-selected indeterminate:!bg-variable-selected focus-visible:!outline-variable-selected'
                  }
                />
                <svg
                  fill="none"
                  viewBox="0 0 14 14"
                  className={`pointer-events-none col-start-1 row-start-1 ${_size.checkbox} self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25`}
                >
                  {
                    type === 'radio'
                      ? <circle
                          // cx={(_size.checkbox.match(/\d+/)?.[0] as unknown as number) / 2}
                          // cy={(_size.checkbox.match(/\d+/)?.[0] as unknown as number) / 2}
                          // r={(_size.checkbox.match(/\d+/)?.[0] as unknown as number) / 6}
                          cx={7}
                          cy={7}
                          r={2.5}
                          className="fill-white opacity-0 group-has-[:checked]:opacity-100"
                        />
                      : <>
                          <path
                            d="M4 8L6 10L10 4.5"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-[:checked]:opacity-100"
                          />
                          <path
                            d="M4 7H10"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-[:indeterminate]:opacity-100"
                          />
                        </>
                  }
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
                  className={
                    `col-start-1 row-start-1 relative ${_size.toggleWidth} ${_size.toggleHeight} bg-gray-200 peer-focus-visible:outline-none peer-focus-visible:ring-4 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full ${_size.toggleAfterSize} after:transition-all ` +
                    // Default
                    'peer-focus-visible:ring-blue-300 peer-checked:bg-blue-600 ' +
                    // Variable-selected color defined?
                    'peer-focus-visible:!ring-variable-selected peer-checked:!bg-variable-selected '
                    // Dark mode not used yet...
                    // 'dark:peer-focus-visible:ring-blue-800 dark:bg-gray-700 dark:border-gray-600 '
                  }
                />
              </div>
        }
      </div>
      {text && 
        <label for={id} className="self-center text-sm select-none">
          <span className="text-gray-900">{text}</span>
          <span className="ml-2 text-gray-500">{subtext}</span>
        </label>
      }
    </div>
  )
}
