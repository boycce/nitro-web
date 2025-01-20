import { isRegex, deepFind, s3Image } from '../../../util.js'
import { DropHandler } from './drop-handler.jsx'

export function Drop({ awsUrl, className, id, name, onChange, multiple, state, ...props }) {
  /**
   * @param {string} name - field name or path on state (used to match errors), e.g. 'avatar', 'company.avatar'
   * @param {string} <id> - not required, name used if not provided
   * @param {function} onChange({ target: { id: <{name}|errors>, value } }) - gets called on success/error
   * @param {object} state - State object to get the value, and check errors against
   */
  if (!name) throw new Error('Drop component requires a `name` prop')
  const inputId = id ||name
  const stateRef = useRef()
  const [urls, setUrls] = useState([])
  stateRef.current = state

  // Input is always controlled if state is passed in
  if (props.value) {
    var value = props.value
  } else if (typeof state == 'object') {
    value = deepFind(state, name)
    if (typeof value == 'undefined') value = null
  }

  // An error matches this input path
  for (let item of (state?.errors || [])) {
    if (isRegex(name) && (item.title||'').match(name)) var error = item
    else if (item.title == name) error = item
  }

  useEffect(() => {
    (async () => setUrls(await getUrls(value)))()
  }, [value])

  function tryAgain (e) {
    e.preventDefault()
    // clear file input to allow reupload
    document.getElementById(name).value = ''
    if (onChange) {
      const errors = (stateRef.errors||[]).filter(e => e.title != name)
      onChange({
        // remove file from state
        target: { id: name, value: null },
        // reset (server) errors
        errors: errors.length ? errors : undefined,
      })
    }
  }

  async function onFileAttach (files=[]) { 
    // files is a FileList object
    if (onChange) onChange({ target: { id: name, value: multiple ? files : files[0] } })
  }

  async function getUrls(objectOrFileListItem) {
    /**
     * @param {object|FileList} objectOrFileListItem - FileList object or monastery image object
     * @returns {Promise} - Resolves to an array of image URLs
     */
    // Make sure FileLists are converted to a real array
    if (!objectOrFileListItem) return []
    const array = objectOrFileListItem.length ? Array.from(objectOrFileListItem) : [objectOrFileListItem]
    return Promise.all(array.map((file) => {
      return new Promise((resolve, reject) => {
        if (file.lastModified) {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        } else {
          resolve(s3Image(awsUrl, file))
        }
      })
    }))
  }

  // function getFilename (objectOrFile) {
  //   if (objectOrFile.lastModified) return objectOrFile.name
  //   else return 'avatar.jpg'
  // }

  return (
    <div class={`mt-input-before mb-input-after ${className || ''}`}>
      <input 
        {...props}
        id={inputId}
        type="file"
        onChange={(e) => onFileAttach(e.target.files)}
        hidden
      />
      <DropHandler 
        onDrop={onFileAttach} 
        class="flex flex-column justify-center items-center text-center gap-2 text-grey-300 text-sm px-8 min-h-[300px]"
      >
        {
          !value &&
          <>
            {/* {todo upload svg here} */}
            <div>
              Drag and drop your file here&nbsp;
              <label class="weight-500 inline-block text-sm text-primary" for={inputId}>or select a file</label>
            </div>
          </>
        }
        {
          value &&
          <>
            {
              urls.map((url, i) => (
                <div key={i} class="flex align-items-center gap-1">
                  <img src={url} width="100%" />
                </div>
              ))
            }
            <div>
              Your file has been added successfully.&nbsp; 
              <Link to="#" class="text-primary" onClick={tryAgain}>Use another file?</Link>
            </div>
          </>
        }
      </DropHandler>
      {error && <div class="form-error mt-0-5">{error.detail}</div>}
    </div>
  )
}