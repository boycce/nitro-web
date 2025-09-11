import { JSX, useState, useCallback } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Checkbox, queryObject, queryString, twMerge } from 'nitro-web'

export interface TableColumn {
  label: string
  value: string
  className?: string
  disableSort?: boolean
  innerClassName?: string
  minWidth?: number
  overflow?: boolean
  rowLinesMax?: number
  /** Use if the value is different from the sortBy */
  sortByValue?: string 
  align?: 'left' | 'center' | 'right'
}

export type TableRow = {
  _id?: string
}
  
export type TableProps<T> = {
  columns: TableColumn[]
  rows: T[]
  generateTd: (col: TableColumn, row: T, i: number, isLast: boolean) => JSX.Element | null
  generateCheckboxActions?: (selectedRowIds: string[]) => JSX.Element | null
  headerHeightMin?: number
  rowHeightMin?: number
  rowContentHeightMax?: number
  rowLinesMax?: number
  rowSideColor?: (row?: T) => { className: string, width: number }
  rowGap?: number
  rowOnClick?: (row: T) => void
  columnGap?: number
  columnPaddingX?: number
  className?: string
  tableClassName?: string
  rowClassName?: string
  columnClassName?: string
  columnSelectedClassName?: string
  columnHeaderClassName?: string
  checkboxClassName?: string
  checkboxSize?: number
  isLoading?:boolean
}

export function Table<T extends TableRow>({ 
  rows, 
  columns: columnsProp, 
  generateTd, 
  generateCheckboxActions,
  headerHeightMin=40,
  rowHeightMin=48, 
  rowContentHeightMax, 
  rowLinesMax, 
  rowSideColor,
  rowGap=0,
  rowOnClick,
  columnGap=11,
  columnPaddingX=11,
  // Class names
  className,
  tableClassName,
  rowClassName,
  columnClassName,
  columnSelectedClassName,
  columnHeaderClassName,
  checkboxClassName,
  checkboxSize=16,
  isLoading=false,
}: TableProps<T>) {
  const location = useLocation()
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const _columnClassName = 'table-cell py-1 align-middle text-sm border-y border-border ' +
    'first:border-l last:border-r border-t-0 box-border'
  const [now] = useState(new Date().getTime())

  const columns = useMemo(() => {
    const checkboxCol: TableColumn = { value: 'checkbox', label: '', disableSort: true }
    const cols = (generateCheckboxActions ? [checkboxCol, ...columnsProp] : columnsProp).map((col, _i) => ({
      ...col,
      rowLinesMax: typeof col.rowLinesMax != 'undefined' ? col.rowLinesMax : rowLinesMax,
      sortByValue: col.sortByValue || col.value,
      align: col.align || 'left',
    }))
    return cols
  }, [columnsProp])

  const onSelect = useCallback((idOrAll: string, checked: boolean) => {
    setSelectedRowIds((o) => {
      if (idOrAll == 'all' && checked) return (rows ?? []).map(row => row?._id||'')
      else if (idOrAll == 'all' && !checked) return []
      else if (o.includes(idOrAll) && !checked) return o.filter(id => id != idOrAll)
      else if (!o.includes(idOrAll) && checked) return [...o, idOrAll]
      else return o
    })
  }, [selectedRowIds, rows])
  
  const getAlignClass = useCallback((align: TableColumn['align'], _returnJustify?: boolean) => {
    if (_returnJustify) return align == 'left' ? '' : align == 'center' ? 'justify-center' : 'justify-end'
    else return align == 'left' ? '' : align == 'center' ? 'text-center' : 'text-right'
  }, [])

  // Reset selected rows when the location changes, or the number of rows changed (e.g. when a row is removed)
  useEffect(() => setSelectedRowIds([]), [location.key, (rows ?? []).map(row => row?._id||'').join(',')])

  // --- Sorting ---

  const navigate = useNavigate()
  const query = useMemo(() => ({ ...queryObject(location.search) }), [location.search])
  const sortBy = useMemo(() => query.sortBy || 'createdAt', [query.sortBy])
  const sort = useMemo(() => !query.sort && query.sortBy == 'createdAt' ? '-1' : (query.sort || '1'), [query.sort])

  const onSort = useCallback((item: TableColumn) => {
    const queryStr = queryString({ 
      ...query, 
      sort: sortBy == item.sortByValue ? (sort == '1' ? '-1' : '1') : '1',
      sortBy: item.sortByValue,
    })
    navigate(location.pathname + queryStr, { replace: true })
  }, [location.pathname, query, sort, sortBy])

  return (
    <div 
      style={{ marginTop: -rowGap }}
      className={twMerge('overflow-x-auto thin-scrollbar', className)}
    >
      <div 
        style={{ borderSpacing: `0 ${rowGap}px` }}
        className={twMerge('table w-full border-separate', tableClassName)}
      >
        {/* Thead row */}
        <div className="table-row relative">
          {
            columns.map((col, j) => {
              const disableSort = col.disableSort || selectedRowIds.length
              const sideColor = j == 0 && rowSideColor ? rowSideColor(undefined) : undefined
              const sideColorPadding = sideColor && rows.length > 0 ? sideColor.width + 5 : 0
              const pl = sideColorPadding + (j == 0 ? columnPaddingX : columnGap)
              const pr = j == columns.length - 1 ? columnPaddingX : columnGap
              return (
                <div
                  key={j}
                  onClick={disableSort ? undefined : () => onSort(col)}
                  style={{ height: headerHeightMin, minWidth: col.minWidth, paddingLeft: pl, paddingRight: pr }}
                  className={twMerge(
                    _columnClassName,
                    'h-auto text-sm font-medium border-t-1',
                    disableSort ? '' : 'cursor-pointer select-none',
                    getAlignClass(col.align),
                    columnClassName,
                    columnHeaderClassName,
                    col.className
                  )}
                >
                  <div
                    style={{ maxHeight: rowContentHeightMax }}
                    className={twMerge(
                      col.value == 'checkbox' ? 'relative' : getLineClampClassName(col.rowLinesMax),
                      rowContentHeightMax ? 'overflow-hidden' : '',
                      col.overflow ? 'overflow-visible' : '',
                      col.innerClassName
                    )}
                  > 
                    {
                      col.value == 'checkbox'
                        ? <>
                            <Checkbox 
                              size={checkboxSize}
                              name={`checkbox-all-${now}`}
                              hitboxPadding={5}
                              className='!m-0 py-[5px]' // py-5 is required for hitbox (restricted to tabel cell height)
                              checkboxClassName={twMerge('border-foreground shadow-[0_1px_2px_0px_#0000001c]', checkboxClassName)}
                              onChange={(e) => onSelect('all', e.target.checked)}
                            />
                            <div 
                              className={`${selectedRowIds.length ? 'block' : 'hidden'} [&>*]:absolute [&>*]:inset-y-0 [&>*]:left-[35px] [&>*]:z-10 whitespace-nowrap`}
                            >
                              {generateCheckboxActions && generateCheckboxActions(selectedRowIds)}
                            </div>
                          </>
                        : <span className={twMerge(
                            'flex items-center gap-x-2 transition-opacity',
                            selectedRowIds.length ? 'opacity-0' : '',
                            getAlignClass(col.align, true)
                          )}>
                            <span>{col.label}</span>
                            {
                              (!col.disableSort && sortBy == col.sortByValue) 
                                ? (sort == '1' 
                                    ? <ChevronDownIcon class='shrink-0 size-[16px]' /> 
                                    : <ChevronUpIcon class='shrink-0 size-[16px]' />
                                  )
                                : col.align == 'left' && <div class='size-[16px] shrink-0' /> // prevent layout shift on sort
                            }
                          </span>
                    }
                  </div>
                </div>
              )
            })
          }
        </div>
        {/* Tbody rows */}
        {
          rows.map((row: T, i: number) => {
            const isSelected = selectedRowIds.includes(row?._id||'')
            return (
              <div 
                key={`${row._id}-${i}`}
                onClick={rowOnClick ? () => rowOnClick(row) : undefined}
                className={twMerge(
                  `table-row relative ${rowOnClick ? 'cursor-pointer' : ''} ${isSelected ? 'is-selected' : ''}`, rowClassName
                )}
              >
                {
                  columns.map((col, j) => {
                    const sideColor = j == 0 && rowSideColor ? rowSideColor(row) : undefined
                    const pl = j == 0 ? columnPaddingX : columnGap
                    const pr = j == columns.length - 1 ? columnPaddingX : columnGap
                    return (
                      <div
                        key={j}
                        style={{ height: rowHeightMin, paddingLeft: pl, paddingRight: pr }}
                        className={twMerge(
                          _columnClassName,
                          getAlignClass(col.align),
                          columnClassName,
                          col.className,
                          isSelected && `bg-gray-50 ${columnSelectedClassName||''}`
                        )}
                      >
                        <div 
                          style={{ 
                            maxHeight: rowContentHeightMax, 
                            paddingLeft: sideColor ? sideColor.width + 5 : 0,
                          }}
                          className={twMerge(
                            rowContentHeightMax ? 'overflow-hidden' : '',
                            getLineClampClassName(col.rowLinesMax),
                            col.overflow ? 'overflow-visible' : '',
                            col.innerClassName
                          )}
                        >
                          {
                            // Side color
                            sideColor && 
                            <div 
                              className={`absolute top-0 left-0 h-full ${sideColor?.className||''}`} 
                              style={{ width: sideColor.width }}
                            />
                          }
                          {
                            col.value == 'checkbox' 
                              ? <Checkbox 
                                  size={checkboxSize} 
                                  name={`checkbox-${row._id}`} 
                                  onChange={(e) => onSelect(row?._id || '', e.target.checked)}
                                  checked={selectedRowIds.includes(row?._id || '')}
                                  onClick={(e) => e.stopPropagation()}
                                  hitboxPadding={5}
                                  className='!m-0 py-[5px]' // py-5 is required for hitbox (restricted to tabel cell height)
                                  checkboxClassName={twMerge('border-foreground shadow-[0_1px_2px_0px_#0000001c]', checkboxClassName)}
                                />
                              : generateTd(col, row, i, i == rows.length - 1)
                          }
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )
          })
        }
        {
          rows.length == 0 &&
          <div className='table-row relative'>
            {
              columns.map((col, j) => {
                const pl = j == 0 ? columnPaddingX : columnGap
                const pr = j == columns.length - 1 ? columnPaddingX : columnGap
                return (
                  <div
                    key={j}
                    style={{ height: rowHeightMin, paddingLeft: pl, paddingRight: pr }}
                    className={twMerge(_columnClassName, columnClassName, col.className)}
                  >
                    <div
                      className={twMerge(
                        'absolute top-0 h-full flex items-center justify-center text-sm',
                        isLoading ? '' : 'text-gray-500',
                        col.innerClassName
                      )}
                    >
                      { j == 0 && (isLoading ? <>Loading<span className="relative ml-[2px] loading-dots" /></> : 'No records found.') }
                    </div>
                  </div>
                )
              })
            }
          </div>
        }
      </div>
    </div>
  )
}

function getLineClampClassName(num?: number) {
  // Splayed out for tailwind to pick up we are using the classNames below
  if (num == 1) return 'line-clamp-1'
  else if (num == 2) return 'line-clamp-2'
  else if (num == 3) return 'line-clamp-3'
  else if (num == 4) return 'line-clamp-4'
  else if (num == 5) return 'line-clamp-5'
  else if (num == 6) return 'line-clamp-6'
}