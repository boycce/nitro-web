// Todo: show correct message type, e.g. error, warning, info, success `${store.message.type || 'success'}`
import { isObject, isString, queryObject } from 'nitro-web/util'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { MessageObject } from 'nitro-web/types'

/**
 * Shows a message
 * Triggered by navigating to a link with a valid query string, or
 * by setting store.message to a string or more explicitly, to an object
 **/
export function Message() {
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
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-20 nitro-message"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition show={isObject(store.message) && visible}> 
            <div className="pointer-events-auto max-w-[350px] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 
              transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 
              data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 
              data-[closed]:data-[enter]:sm:translate-y-0">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />
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
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 
                        focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}
