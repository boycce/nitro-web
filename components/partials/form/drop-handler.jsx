export const DropHandler = ({ onDrop, children, className }) => {
  const dropRef = useRef()
  let dragCounter = useRef(0).current
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let div = dropRef.current
    div.addEventListener('dragenter', handleDragIn)
    div.addEventListener('dragleave', handleDragOut)
    div.addEventListener('dragover', handleDragOver)
    div.addEventListener('drop', handleDrop)
    return () => {
      div.removeEventListener('dragenter', handleDragIn)
      div.removeEventListener('dragleave', handleDragOut)
      div.removeEventListener('dragover', handleDragOver)
      div.removeEventListener('drop', handleDrop)
    }
  }, [])

  const handleDragIn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true)
    }
  }

  const handleDragOut = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter--
    if (dragCounter === 0) {
      setDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files)
      // e.dataTransfer.clearData() // causes an error in firefox
      dragCounter = 0
    }
  }

  return (
    <div 
      ref={dropRef}
      class={`${className} relative w-full p-[20px] border-2 border-dashed border-input-border rounded-md ${dragging ? 'border-primary before:content-[""] before:absolute before:inset-0 before:bg-primary before:opacity-5' : ''}`}
    >
      {children}
    </div>
  )
}
