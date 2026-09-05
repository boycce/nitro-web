import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { queryObject, queryString, twMerge } from 'nitro-web'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button as BaseButton } from './button'

export type PaginationProps = {
  total: number
  perPage?: number
  className?: string
  elements?: { Button?: typeof BaseButton } // pass your project's extended Button
}

export function Pagination({ total, perPage=16, className, elements }: PaginationProps) {
  // Page controls driven by the `?page=` query param
  const Button = elements?.Button || BaseButton
  const navigate = useNavigate()
  const location = useLocation()
  const query = useMemo(() => ({ ...queryObject(location.search) }), [location.search])
  const [currentPage, setCurrentPage] = useState(parseInt(query.page as string || '1'))
  const totalPages = useMemo(() => Math.ceil(total / perPage), [total, perPage])
  const locationRef = useRef(location)

  useEffect(() => {
    setCurrentPage(parseInt(query.page as string || '1'))
  }, [query.page])

  useEffect(() => {
    locationRef.current = location
  }, [location])

  const goToPage = (page: number) => {
    const updatedQuery = { ...query, page: String(page) }
    navigate(`${locationRef.current.pathname}${queryString(updatedQuery)}`)
  }

  return (
    <div className={twMerge('flex items-center justify-center gap-7 text-xs font-medium', className)}>
      <span>Page {currentPage} of {totalPages}</span>

      <div className="flex items-center gap-[7px]">
        {[
          { Icon: ChevronsLeft, page: 1, disabled: currentPage === 1 },
          { Icon: ChevronLeft, page: currentPage - 1, disabled: currentPage === 1 },
          { Icon: ChevronRight, page: currentPage + 1, disabled: currentPage === totalPages },
          { Icon: ChevronsRight, page: totalPages, disabled: currentPage === totalPages },
        ].map(({ Icon, page, disabled }, i) => (
          <Button
            key={i}
            onClick={() => goToPage(page)}
            disabled={disabled}
            color="white"
            size="sm"
            IconCenter={<Icon size={16} strokeWidth={2.2} />}
            className={`h-[31px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
