import { Fragment, useRef, useState } from 'react'
import { twMerge } from 'nitro-web'
import { Modal } from './modal'
import { Button as BaseButton } from './button'

interface ModalProps {
  elements?: { Button?: typeof BaseButton } // pass your project's extended Button
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: React.ReactNode
  children?: React.ReactNode
  maxWidth?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

interface ConfirmModalProps extends ModalProps {
  onSubmit: () => Promise<void> | void
  confirmText?: string
}

interface FormModalProps extends ModalProps {
  onSubmit?: () => Promise<void> | void
  submitText?: string
  submitIcon?: React.ReactNode
  footerNote?: React.ReactNode
  xClassName?: string
}

// Confirm dialog, prevents double submissions and picks a danger button for remove/delete titles
export function ConfirmModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Warning',
  subtitle = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  children,
  elements,
  className,
  titleClassName,
  subtitleClassName,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const Button = elements?.Button || BaseButton

  // Cache the values to prevent flickering when closing
  const cached = useRef({ title, subtitle, confirmText, children })
  if (isOpen) cached.current = { title, subtitle, confirmText, children }

  async function handleSubmit() {
    if (isLoading) return
    setIsLoading(true)
    try {
      await onSubmit()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      show={isOpen}
      setShow={onClose}
      maxWidth="480px"
      className={twMerge('p-9 pt-8 rounded-md flex flex-col items-center gap-4', className)}
    >
      <div className="text-center">
        <h3 className={twMerge('h3 text-[18px] mb-2.5', titleClassName)}>{cached.current.title}</h3>
        {cached.current.subtitle && <p className={twMerge('h5 text-gray-500 mb-0', subtitleClassName)}>{cached.current.subtitle}</p>}
      </div>
      {cached.current.children}
      <div className="self-stretch flex mt-1.5">
        <Button className="flex-1"
          color={title.match(/remove|delete/i) ? 'danger' : 'primary'}
          onClick={handleSubmit}
          isLoading={isLoading}
        >
          {cached.current.confirmText}
        </Button>
      </div>
    </Modal>
  )
}

// Form dialog with a header, optional submit button and footer note, prevents double submissions
export function FormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitText = 'Submit',
  submitIcon,
  footerNote,
  maxWidth = '560px',
  elements,
  className,
  titleClassName,
  subtitleClassName,
  xClassName,
}: FormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const Button = elements?.Button || BaseButton

  // Cache the values to prevent flickering when closing
  const cached = useRef({ title, subtitle, submitText, submitIcon, footerNote, children })
  if (isOpen) cached.current = { title, subtitle, submitText, submitIcon, footerNote, children }

  async function handleSubmit() {
    if (isLoading || !onSubmit) return
    setIsLoading(true)
    try {
      await onSubmit()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      show={isOpen}
      setShow={onClose}
      maxWidth={maxWidth}
      className={twMerge('p-8 rounded-md flex flex-col gap-5', className)}
      xClassName={twMerge('bg-[rgba(62,68,140,0.06)] hover:bg-[rgba(62,68,140,0.11)] rounded-md right-0 p-2.5 m-[11px]', xClassName)}
    >
      {(cached.current.title || cached.current.subtitle) && (
        <Fragment>
          <div className={twMerge('-m-8 mb-0 px-8 py-[18px] bg-[rgba(63,68,142,0.06)] rounded-t-md', titleClassName)}>
            <h3 className="h3 text-[15.5px] mb-0 pb-0">{cached.current.title}</h3>
          </div>
          {cached.current.subtitle && (
            <p className={twMerge('h5 text-gray-500 mb-0 text-left', subtitleClassName)}>{cached.current.subtitle}</p>
          )}
        </Fragment>
      )}
      {cached.current.children}
      {onSubmit && (
        <div className="self-stretch flex mt-1.5">
          <Button className="flex-1" color="primary" onClick={handleSubmit} isLoading={isLoading} IconRight={cached.current.submitIcon}>
            {cached.current.submitText}
          </Button>
        </div>
      )}
      {cached.current.footerNote && (
        <div className="-mt-1 text-xs text-gray-500 flex items-center justify-center gap-1.5">{cached.current.footerNote}</div>
      )}
    </Modal>
  )
}
