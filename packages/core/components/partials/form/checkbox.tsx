/* eslint-disable @typescript-eslint/no-explicit-any */
import { twMerge, deepFind, getErrorFromState } from 'nitro-web/util'
import { Errors, type Error } from 'nitro-web/types'

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {  
  /** field name or path on state (used to match errors), e.g. 'date', 'company.email' */
  name: string
  /** name is applied if id is not provided. Used for radios */
  id?: string 
  /** state object to get the value, and check errors against */
  state?: { errors?: Errors, [key: string]: any }
  size?: number
  subtext?: string|React.ReactNode
  text?: string|React.ReactNode
  type?: 'checkbox' | 'radio' | 'toggle'
  checkboxClassName?: string
  svgClassName?: string
  labelClassName?: string
  /** title used to find related error messages */
  errorTitle?: string|RegExp
}

export function Checkbox({ 
  state, size, subtext, text, type='checkbox', className, checkboxClassName, svgClassName, labelClassName, errorTitle, ...props 
}: CheckboxProps) {
  // Checkbox/radio/toggle component
  let value!: boolean
  const error = getErrorFromState(state, errorTitle || props.name)
  const id = props.id || props.name

  if (!props.name) throw new Error('Checkbox requires a `name` prop')
  
  // Value: Input is always controlled if state is passed in
  if (typeof props.checked !== 'undefined') value = props.checked
  else if (typeof state == 'object') {
    const v = deepFind(state, props.name) as boolean | undefined
    value = v ?? false
  }

  const BORDER = 2
  const checkboxSize = size ?? 14
  const toggleHeight = size ?? 18
  const toggleWidth = toggleHeight * 2 - BORDER * 2
  const toggleAfterSize = toggleHeight - BORDER * 2

  return (
    <div 
      className={'mt-2.5 mb-6 ' + twMerge(`mt-input-before mb-input-after text-sm nitro-checkbox ${className}`)}
    >
      <div className="flex gap-3 items-baseline">
        <div className="shrink-0 flex items-center">
          <div className="w-0">&nbsp;</div>
          <div className="group relative">
            {
              type !== 'toggle'
                ? <>
                    <input
                      {...props}
                      id={id}
                      type={type}
                      style={{ width: checkboxSize, height: checkboxSize }}
                      checked={value}
                      className={
                        twMerge(
                          `${type === 'radio' ? 'rounded-full' : 'rounded'} appearance-none border border-gray-300 bg-white forced-colors:appearance-auto disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ` + 
                          // Variable-selected theme colors (was .*-blue-600)
                          'checked:border-variable-selected checked:bg-variable-selected indeterminate:border-variable-selected indeterminate:bg-variable-selected focus-visible:outline-variable-selected ' +
                          // Dark mode not used yet... dark:focus-visible:outline-blue-800
                          checkboxClassName
                        )
                      }
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      style={{ width: checkboxSize, height: checkboxSize }}
                      className={twMerge('absolute top-0 left-0 pointer-events-none justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25', svgClassName)}
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
                  </>
                : <>
                    <input 
                      {...props}
                      id={id}
                      type="checkbox" 
                      className="sr-only peer"
                      checked={value}
                    />
                    <label
                      for={id}
                      style={{ width: toggleWidth, height: toggleHeight }}
                      className={
                        twMerge(
                          'block bg-gray-200 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ' +
                          // Variable-selected theme colors (was .*-blue-600)
                          'peer-checked:bg-variable-selected peer-focus-visible:outline-variable-selected ' +
                          labelClassName
                        )
                      }
                    >
                      <span
                        style={{ width: toggleAfterSize, height: toggleAfterSize }}
                        className={
                          'absolute top-[2px] start-[2px] bg-white border-gray-300 border rounded-full transition-all group-has-[:checked]:border-white group-has-[:checked]:translate-x-full '
                        }
                      />
                    </label>
                  </>
            }
          </div>
        </div>
        {text && 
          <label for={id} className="text-[length:inherit] leading-[inherit] select-none">
            <span className="text-gray-900">{text}</span>
            <span className="ml-2 text-gray-500">{subtext}</span>
          </label>
        }
      </div>
      {error && <div class="mt-1.5 text-xs text-danger-foreground nitro-error">{error.detail}</div>}
    </div>
  )
}
