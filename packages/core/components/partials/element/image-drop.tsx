import { useEffect, useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { DropHandler } from 'nitro-web'
import { deepFind, getErrorFromState, s3Image, twMerge } from 'nitro-web/util'
import type { Errors, MonasteryFile } from 'nitro-web/types'

type ImageDropProps = {
  awsUrl?: string
  className?: string
  /** Field name or path on state (used to match errors), e.g. 'drawing' */
  name: string
  /** Optional id for the input element, defaults to name */
  id?: string
  /** Called with the selected/dropped file, or null when removed */
  onChange?: (event: { target: { name: string, value: File | null }, errors?: Errors }) => void
  state?: { errors?: Errors, [key: string]: unknown }
  /** What the page is showing when this field is empty — an image that came from somewhere else */
  inheritedUrl?: string
  /** Where that image came from, e.g. 'Matched from the bulk upload' */
  inheritedNote?: string
}

type ImageValue = File | MonasteryFile | null

export function ImageDrop({ awsUrl, className, id, name, onChange, state, inheritedUrl, inheritedNote }: ImageDropProps) {
  // A friendlier Drop for images: the whole area is clickable, with an outlined image icon and a preview
  const inputId = id || name
  const error = getErrorFromState(state, name)
  const [url, setUrl] = useState<string | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const value = (typeof state === 'object' ? deepFind(state, name) : null) as ImageValue

  useEffect(() => {
    if (!value) return setUrl(null)
    if (value instanceof File) {
      const reader = new FileReader()
      reader.onload = () => setUrl(String(reader.result))
      reader.readAsDataURL(value)
    } else {
      setUrl(s3Image(awsUrl || '', value))
    }
  }, [value, awsUrl])

  function onFileAttach(files: FileList) {
    if (files?.[0] && onChange) onChange({ target: { name: name, value: files[0] } })
  }

  function onRemove(e: React.MouseEvent) {
    // A label click would reopen the selector, so stop it and clear the field (and any server error on it)
    e.preventDefault()
    e.stopPropagation()
    const input = document.getElementById(inputId) as HTMLInputElement | null
    if (input) input.value = ''
    if (onChange) {
      const errors = (stateRef.current?.errors || []).filter(err => err?.title !== name)
      onChange({ target: { name: name, value: null }, errors: errors.length ? errors : undefined })
    }
  }

  return (
    <div class={twMerge('nitro-field mb-input-after', className)}>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFileAttach(e.currentTarget.files as FileList)}
      />
      <label for={inputId} class="block cursor-pointer group" aria-label={`Select an image for ${name}`}>
        <DropHandler
          onDrop={onFileAttach}
          className={'flex flex-col justify-center items-center text-center gap-2.5 text-sm text-grey-1 px-6 py-8 ' +
            'min-h-[220px] transition-colors group-hover:border-primary/60 group-hover:bg-primary/[0.03]'}
        >
          {/* Nothing uploaded on this field, but the page is showing an image from elsewhere. Hiding it made the
              edit screen look like the page had no artwork at all. */}
          {!url && !!inheritedUrl && (
            <div class="flex flex-col items-center gap-2.5 w-full">
              <img src={inheritedUrl} alt="" class="max-h-[180px] max-w-full object-contain pointer-events-none" />
              <div class="text-xs text-grey-2">
                {inheritedNote ? `${inheritedNote} · ` : ''}Click or drop a file to override it here
              </div>
            </div>
          )}
          {!url && !inheritedUrl && (
            <div class="flex flex-col items-center gap-2.5 pointer-events-none">
              <ImageIcon size={30} strokeWidth={1.25} class="text-grey-2 transition-colors group-hover:text-primary" />
              <div>
                Drag and drop your image here, or
                <span class="text-primary font-medium"> select a file</span>
              </div>
            </div>
          )}
          {!!url && (
            <div class="flex flex-col items-center gap-2.5 w-full">
              <img src={url} alt="" class="max-h-[180px] max-w-full object-contain pointer-events-none" />
              <div class="text-xs text-grey-2">
                Click or drop a file to replace &nbsp;·&nbsp;
                <button type="button" class="text-danger" onClick={onRemove}>Remove</button>
              </div>
            </div>
          )}
        </DropHandler>
      </label>
      {error && <div class="form-error mt-0-5">{error.detail}</div>}
    </div>
  )
}
