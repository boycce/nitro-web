import { queryObject, twMerge } from 'nitro-web/util'
import { IsFirstRender } from 'nitro-web'
import { X, CircleCheck } from 'lucide-react'
import { MessageObject } from 'nitro-web/types'
import React from 'react'

let messageInstanceCount = 0

type MessageProps = {
  className?: string
  classNameWrapper?: string
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}
/**
 * Shows a message by store.message or query param.
 *   - A tilde ~ is appended so we can keep clicking links and seeing the message again
 * 
 * Showing a message by store.message:
 * 
 *   The store.message value can be a string or an object with the following properties:
 *   - @param {string} text - The text of the message
 *   - @param {'error' | 'warning' | 'info' | 'success'} [type] 
 *   - @param {number} [timeout] - The timeout in milliseconds to hide the message
 *   
 *   @example
 *     setStore({ message: 'Added successfully.' })
 *     setStore({ message: { type: 'error', default: 'Sorry, there was an error.' } })
 *     setStore({ message: { type: 'success', text: 'Added successfully.', timeout: 5000 } })
 *     setStore({ message: '' }) (Clears the message)
 * 
 * Showing a message by query param:
 *   
 *   @example
 *     /?error                   (Shows 'Sorry, there was an error.')
 *     /?error=Woops             (Shows 'Woops'
 *     /?added                   (Shows the default text for the 'added' message type)
 **/
export function Message({ className, classNameWrapper, position='top-right' }: MessageProps) {
  const [store, setStore] = useTracked()
  const [visible, setVisible] = useState(false)
  const [messageObject, setMessageObject] = useState<MessageObject>()
  const location = useLocation()
  const navigate = useNavigate()
  const isFirstRender = IsFirstRender()

  const queryDefaultMap: Record<string, MessageObject> = {
    // Primary message types:
    'error': { type: 'error', text: 'Sorry, there was an error.' },
    'warning': { type: 'warning', text: '' },
    'info': { type: 'info', text: '' },
    'success': { type: 'success', text: '' },

    // Predefined message types:
    'added': { type: 'success', text: 'Added successfully.' },
    'created': { type: 'success', text: 'Created successfully.' },
    'oauth-error': { type: 'error', text: 'There was an error trying to signin, please try again.' },
    'removed': { type: 'success', text: 'Removed.' },
    'signin': { type: 'error', text: 'Please sign in to access this page' },
    'unauth': { type: 'error', text: 'You are unauthorised.' },
    'updated': { type: 'success', text: 'Updated successfully.' },
  } 
  const colorMap = {
    'error': 'text-danger',
    'warning': 'text-warning',
    'info': 'text-info',
    'success': 'text-success',
  }
  const positionMap = {
    'top-left': ['sm:items-start sm:justify-start', 'sm:translate-y-0  sm:translate-x-[-0.5rem]'],
    'top-center': ['sm:items-start sm:justify-center', 'sm:translate-y-[-0.5rem]'],
    'top-right': ['sm:items-start sm:justify-end', 'sm:translate-y-0 sm:translate-x-1'],
    'bottom-left': ['sm:items-end sm:justify-start', 'sm:translate-y-0  sm:translate-x-[-0.5rem]'],
    'bottom-center': ['sm:items-end sm:justify-center', 'sm:translate-y-1'],
    'bottom-right': ['sm:items-end sm:justify-end', 'sm:translate-y-0 sm:translate-x-1'],
  }
  const color = colorMap[messageObject?.type || 'success']
  const positionArr = positionMap[(position as keyof typeof positionMap)]

  useEffect(() => {
    // Listen for query changes
    const query = queryObject(location.search, { emptyStringAsTrue: false })

    // Show the first found message from a query string
    for (const key in query) {
      if (!query.hasOwnProperty(key)) continue
      if (!Object.keys(queryDefaultMap).includes(key)) continue
      const defaultMessageObject = queryDefaultMap[key as keyof typeof queryDefaultMap]
      if (Array.isArray(query[key])) continue
      const rawQueryValue = query[key] as string
      
      if (rawQueryValue.match(/=$/) && !isFirstRender) {
        // Only show if first render, otherwise skip internal tracking of the message
        continue
      }

      // Parse the raw text value into a message object (remove the bust '~' if present)
      const queryValueDecoded = decodeURIComponent(rawQueryValue).replace(/~$/, '') // replaces + => ' '
      const newMessageObject = parseRawValue(queryValueDecoded, defaultMessageObject)
      setStore(s => ({ ...s, message: newMessageObject }))
      setMessageObject(() => newMessageObject)

      // Add the bust '~' value in the query param, so the user can see the message again when clicking the same link
      const newQuery = new URLSearchParams(location.search)
      newQuery.set(key, queryValueDecoded + '~')

      // Build query string with encodeURIComponent to preserve %20 for spaces
      const parts = []
      for (const [k, v] of newQuery.entries()) {
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v))
      }
      navigate(
        { pathname: location.pathname, search: parts.length ? '?' + parts.join('&') : '' },
        { replace: true }
      )
      break
    }
  }, [location.search])

  useEffect(() => {
    // Listen for store.message changes (onload this may be )
    if (!isAlreadyShown(store.message)) {
      // If not skipped on first render, this will override the query param message above onload
      if (isFirstRender) return
      const newMessageObject = parseRawValue(store.message || '')
      setMessageObject(() => newMessageObject)
      setStore(s => ({ ...s, message: newMessageObject }))
    }
  }, [JSON.stringify(store.message)])

  useEffect(() => {
    // Listen for internal messageObject changes, and show and hide message
    if (!messageObject) return
    const timeout1 = setTimeout(() => setVisible(true), 50)
    const timeout2 = messageObject.timeout !== 0 ? setTimeout(() => setVisible(false), messageObject.timeout || 5000) : undefined
    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [JSON.stringify(messageObject)])

  useEffect(() => {
    messageInstanceCount++
    if (messageInstanceCount > 1) console.error('Nitro: Multiple <Message /> instances can show duplicate notifications.')
    return () => {
      messageInstanceCount--
    }
  }, [])

  function hide() {
    setVisible(false)
    setTimeout(() => setMessageObject(undefined), 250)
  }
  
  function isAlreadyShown(value?: string | MessageObject) {
    if (!value) return false
    else if (typeof value === 'string') return false
    // else if (typeof value === 'string' && value.match(/_$/)) return true //
    else if (typeof value === 'object' && value._date) return true
  }
  
  function parseRawValue(value: string | MessageObject, defaultMessageObject?: MessageObject): MessageObject | undefined {
    // @param defaultMessageObject - default message object to extend from, used for query changes
    if (typeof value === 'string') {
      if (!value && !defaultMessageObject?.text) return
      else if (defaultMessageObject) return { ...defaultMessageObject, text: value || defaultMessageObject.text, _date: Date.now() }
      else return { type: 'success', text: value, _date: Date.now() }
    } else if (typeof value === 'object') {
      if (!value.text) return
      else return { ...value, _date: Date.now() }
    }
  }
  
  return (
    <React.Fragment>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className={`${twMerge(`pointer-events-none items-end justify-center fixed inset-0 flex px-4 py-6 sm:p-6 z-[101] nitro-message ${positionArr[0]} ${classNameWrapper || ''}`)}`}
      >
        <div className="flex flex-col items-center space-y-4">
          {messageObject && (
            <div className={twMerge(
              'overflow-hidden translate-y-[0.5rem] opacity-0 pointer-events-auto max-w-[350px] rounded-md bg-white shadow-lg ring-1 ring-black/5 transition text-sm font-medium text-gray-900',
              positionArr[1],
              (visible ? 'translate-x-0 translate-y-0 sm:translate-x-0 sm:translate-y-0 opacity-100' : ''),
              className
            )}>
              <div className="p-3">
                <div className="flex items-start gap-3 leading-[1.4em]">
                  <div className="flex items-center shrink-0 min-h-[1.4em]">
                    <CircleCheck aria-hidden="true" size={19} className={`${color}`} />
                  </div>
                  <div className="flex flex-1 items-center min-h-[1.4em]">
                    <p>{messageObject.text}</p>
                  </div>
                  <div className="flex items-center shrink-0 min-h-[1.4em]">
                    <button
                      type="button"
                      onClick={hide}
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 
                        focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Close</span>
                      <X aria-hidden="true" size={19} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  )
}
