// Todo: show correct message type, e.g. error, warning, info, success `${store.message.type || 'success'}`
import { isObject, isString, queryObject } from 'nitro-web/util'
import { X, CircleCheck } from 'lucide-react'
import { MessageObject } from 'nitro-web/types'
import { twMerge } from 'nitro-web'

/**
 * Shows a message
 * Triggered by navigating to a link with a valid query string, or
 * by setting store.message to a string or more explicitly, to an object
 **/
export function Message({ className }: { className?: string }) {
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
    'error': 'text-critical',
    'warning': 'text-error',
    'info': 'text-info',
    'success': 'text-success',
  }
  const color = colorMap[(store.message as MessageObject)?.type || 'success']

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
      if (messageObject.timeout !== 0 && !devDontHide) var timeout2 = setTimeout(hide, messageObject.timeout || 5000)
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
        className={`${twMerge(`pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-[101] ${className||''}`)} nitro-message`}
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {isObject(store.message) && (
            <div className={
              'overflow-hidden pointer-events-auto max-w-[350px] rounded-md bg-white shadow-lg ring-1 ring-black/5 transition ' +
              (visible ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0')
            }>
              <div className="p-3">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <CircleCheck aria-hidden="true" size={21} className={`${color} mt-0.5`} />
                  </div>
                  <div className="ml-3 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">{typeof store.message === 'object' && store.message?.text}
                    </p>
                    {/* <p className="mt-1 text-sm text-gray-500">{store.message.text}</p> */}
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={hide}
                      className="inline-flex  rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 
                        focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Close</span>
                      <X aria-hidden="true" size={19} className="mt-0.5" />
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
