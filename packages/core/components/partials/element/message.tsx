// Todo: show correct message type, e.g. error, warning, info, success `${store.message.type || 'success'}`
import { isObject, isString, queryObject } from 'nitro-web/util'
import { X, CircleCheck } from 'lucide-react'
import { MessageObject } from 'nitro-web/types'
import { twMerge } from 'nitro-web'

type MessageProps = {
  className?: string
  classNameWrapper?: string
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}
/**
 * Shows a message
 * Triggered by navigating to a link with a valid query string, or by setting store.message to a string or more explicitly, to an object
 **/
export function Message({ className, classNameWrapper, position='top-right' }: MessageProps) {
  const devDontHide = false
  const [store, setStore] = useTracked()
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  const messageQueryMap = {
    'added': { type: 'success', text: 'Added successfully 👍️' },
    'created': { type: 'success', text: 'Created successfully 👍️' },
    'error': { type: 'error', text: 'Sorry, there was an error' },
    'oauth-error': { type: 'error', text: 'There was an error trying to signin, please try again' },
    'removed': { type: 'success', text: 'Removed' },
    'signin': { type: 'error', text: 'Please sign in to access this page' },
    'updated': { type: 'success', text: 'Updated successfully' },
    'unauth': { type: 'error', text: 'You are unauthorised' },
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
  const color = colorMap[(store.message as MessageObject)?.type || 'success']
  const positionArr = positionMap[(position as keyof typeof positionMap)]

  useEffect(() => {
    return () => {
      setStore(s => ({ ...s, message: '' }))
    }
  }, [])

  useEffect(() => {
    // Finds a message in a query string and show it
    let message
    const query = queryObject(location.search, true)
    for (const key in query) {
      if (!query.hasOwnProperty(key)) continue
      for (const key2 in messageQueryMap) {
        if (key != key2) continue
        // @ts-expect-error
        message = { ...messageQueryMap[key] }
        if (query[key] !== true) message.text = decodeURIComponent(query[key])
      }
    }
    if (message) setStore(s => ({ ...s, message: message }))
  }, [location.search])

  useEffect(() => {
    // Message detection and autohiding
    const now = new Date().getTime()
    const messageObject = store.message as MessageObject

    if (!store.message) {
      return
    // Convert a string into a message object
    } else if (isString(store.message)) {
      setStore(s => ({ ...s, message: { type: 'success', text: store.message as string, date: now }}))
    // Add a date to the message
    } else if (!messageObject.date) {
      setStore(s => ({ ...s, message: { ...messageObject, date: now }}))
    // Show message and hide it again after some time. Send back cleanup if store.message changes
    } else if (messageObject && now - 500 < messageObject.date) {
      const timeout1 = setTimeout(() => setVisible(true), 50)
      if (messageObject.timeout !== 0 && !devDontHide) var timeout2 = setTimeout(hide, messageObject.timeout || 5000000)
      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
      }
    }
  }, [JSON.stringify(store.message)])

  function hide() {
    setVisible(false)
    setTimeout(() => setStore(s => ({ ...s, message: undefined })), 250)
  }

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className={`${twMerge(`pointer-events-none items-end justify-center fixed inset-0 flex px-4 py-6 sm:p-6 z-[101] nitro-message ${positionArr[0]} ${classNameWrapper || ''}`)}`}
      >
        <div className="flex flex-col items-center space-y-4">
          {isObject(store.message) && (
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
                    <p>{typeof store.message === 'object' && store.message?.text}</p>
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
    </>
  )
}
