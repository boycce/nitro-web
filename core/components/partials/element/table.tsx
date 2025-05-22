import { css, theme } from 'twin.macro'
import React, { MouseEvent, JSX, useState, useCallback, SetStateAction, Dispatch } from 'react'
import CheckIcon from '../icons/check'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { UserState } from '../../../types/state'
import { userData } from '../../mockData'
import { sidebarWidth } from './sidebar'

// Note: should be same with 'px-14' of example/components/partials/layouts.tsx
const contentsPadding = 56 //px 

export const tableWidth = '943'

/**
 * roleColor
 */
export const roleColor = {
  'admin': {
    main: theme`colors.primary`,
    text: '#fff',
  },
  'user': {
    main: theme`colors.secondary`,
    text: '#fff',
  },
}

const thList: TableTh[] = [
  { key: 'role', text: 'ROLE' },
  { key: 'name', text: 'NAME' },
  { key: 'email', text: 'EMAIL' },
  { key: 'phone', text: 'PHONE' },
  { key: 'address', text: 'ADDRESS' },
  { key: 'status', text: 'STATUS' },
]

const perPage = 10

export interface TableTh { key: string, text: string; maxWidth?: number; isSortable?: boolean; isExcludeCSV?: boolean }

export type DataItem = UserState;

interface TableProps<T extends DataItem> {
  thList: TableTh[];
  dataList: T[];
  generateTd: (th: TableTh, dataItem: T) => JSX.Element | null;
  needCheckbox?: boolean;
  isSortDescend?: boolean;
  setIsSortDescend?: Dispatch<SetStateAction<boolean>>;
  mainContentsWidth: number;
}

/**
 * handleActionClick
 */
const handleActionClick = (_e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>, _id: string) => {

}

/**
* generateTd
*/
const generateTd = <T extends UserState>(th: TableTh, dataItem: T) => {
  let tdContents = null
  switch (th.key) {
    case 'role':
      tdContents =
        <div style={{ backgroundColor: roleColor[dataItem.role].main, color: roleColor[dataItem.role].text }}
          className='rounded-3xl py-2 px-4 text-xs font-semiBold'>{dataItem.status}</div>
      break
    case 'name':
      tdContents = <div className='text-xs'>{dataItem.firstName} {dataItem.lastName}</div>
      break
    case 'email':
      tdContents = <div className='text-xs'>{dataItem.email}</div>
      break
    case 'phone':
      tdContents = <div className='text-xs'>{dataItem.phone}</div>
      break
    case 'address':
      tdContents = <div className='text-xs'>
        {dataItem.address.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < dataItem.address.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
      break
    case 'status':
      tdContents = <div className='text-xs'>{dataItem.status}</div>
      break
    case 'action':
      tdContents =
        <button
          onClick={(e) => handleActionClick(e, dataItem.id)}
          className='w-[40px] h-[40px] rounded-md border border-input-border flex items-center justify-center hover:bg-input-border transition-[.3]'>
          <ChevronRightIcon className='w-[16px] h-[24px]' />
          <span className='sr-only'>Edit this data item</span>
        </button>
      break
    default:
      console.error('Error: unexpected th')
  }

  return tdContents
}

export const tableProps = {
  thList: thList,
  dataList: userData,
  generateTd: generateTd,
  needCheckbox: true,
  mainContentsWidth: 0,
}

/**
 * Table
 */
export default function Table<T extends DataItem>({ props }: { props: TableProps<T> }) {
  const [currentPage, setCurrentPage] = useState(1)
  const { thList, dataList, generateTd, needCheckbox = false, mainContentsWidth } = props
  const [selectedItem, setSelectedItem] = useState<T[]>([])
  const [isSortDescend, setIsSortDescend] = useState(false)

  /**
   * maxPageNum
   */
  const maxPageNum = useMemo(() => Math.ceil(dataList.length / perPage), [dataList.length])

  /**
   * pageRange
   */
  const pageRange = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage - 1
    return [startIndex, endIndex]
  }, [currentPage])

  /**
   * shownDataList
   */
  const shownDataList = useMemo(() => dataList.filter((_data, i) => !(i < pageRange[0] || i > pageRange[1])), [pageRange, dataList])

  /**
   * toggleAll
   */
  const toggleAll = useCallback(() => {
    setSelectedItem(selectedItem.length === dataList.length ? [] : [...dataList])
  }, [selectedItem, dataList])

  /**
   * handleSortChange
   */
  const handleSortChange = () => {
    if (setIsSortDescend) setIsSortDescend(current => !current)
  }

  return (
    <>
      <div css={tableParentStyle} style={{
        width: `calc(100vw - ${sidebarWidth}px - ${contentsPadding * 2}px)`,
      }}>
        <table css={tableStyle} style={{
          minWidth: `${mainContentsWidth}px`,
          width: '100%',
        }}>
          <thead>
            <tr>
              {
                (needCheckbox) && (
                  <th className="relative pl-8 pr-2">
                    <div className="group absolute inset-x-auto top-1/2 -mt-2 grid size-4 grid-cols-1">
                      <input
                        type="checkbox"
                        className="col-start-1 row-start-1 appearance-none rounded border border-primary bg-white checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:border-primary disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                        checked={selectedItem.length === dataList.length}
                        onChange={toggleAll}
                      />
                      <CheckIcon />
                    </div>
                  </th>
                )
              }
              {
                thList.map(th => {
                  return (
                    <th key={th.text} className='py-3.5 pr-3 text-left text-2xs text-primary-dark font-medium pl-3'>
                      {
                        (th.isSortable) ? (
                          <button className='w-full text-left flex gap-x-4 justify-between' onClick={handleSortChange}>
                            <span>{th.text.toUpperCase()}</span>
                            <ChevronDownIcon className={`size-6 -my-0.5 -mx-1 ${isSortDescend ? 'origin-center rotate-180' : ''}`} />
                          </button>
                        ) : (
                          <div>{th.text.toUpperCase()}</div>
                        )
                      }
                    </th>
                  )
                })
              }
            </tr>
          </thead>
          <tbody>
            {
              shownDataList && (
                shownDataList.map((dataItem: T) => {

                  const trClass = selectedItem.includes(dataItem) ? 'bg-gray-50' : 'bg-white'

                  return (
                    <tr key={dataItem.id} css={trStyle({ rolecolor: roleColor[dataItem.role].main })} className={`${trClass}`}>

                      {
                        needCheckbox && (
                          <td style={
                            {
                              background: `linear-gradient(to right, ${roleColor[dataItem.role].main} 12px, transparent 12px)`,
                            }
                          } className="relative pl-8 pr-4">
                            <div className="group absolute inset-x-auto top-1/2 -mt-2 grid size-4 grid-cols-1">
                              <input
                                type="checkbox"
                                className="col-start-1 row-start-1 appearance-none rounded border border-primary bg-white checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:border-primary disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                checked={selectedItem.includes(dataItem)}
                                onChange={(e) =>
                                  setSelectedItem(
                                    e.target.checked
                                      ? [...selectedItem, dataItem]
                                      : selectedItem.filter((item: T) => item !== dataItem)
                                  )
                                }
                              />
                              <CheckIcon />
                            </div>
                          </td>
                        )
                      }

                      {
                        thList.map((th) => {
                          const tdContents = generateTd(th, dataItem)
                          return (
                            <td
                              key={th.text}
                              style={{ ...(th.maxWidth ? { maxWidth: `${th.maxWidth}px` } : { maxWidth: 'inherit' }) }}>
                              <div className='flex items-center px-2 py-1 text-sm'>{tdContents}</div>
                            </td>
                          )
                        })
                      }
                    </tr>
                  )
                })
              )
            }
          </tbody>
        </table>
      </div>
      <Pagination props={{
        dataListLength: dataList.length,
        currentPage: currentPage,
        setCurrentPage: setCurrentPage,
        maxPageNum: maxPageNum,
      }} />
    </>
  )
}

const tableParentStyle = css`
  position: relative;
  width: 100%;
  margin-top: 20px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: ${theme`colors.primary-dark`} transparent;

&::-webkit-scrollbar {
  width: 8px; /* or whatever width you like */
}

&::-webkit-scrollbar-thumb {
  background-color: ${theme`colors.primary-dark`};
  border-radius: 4px;
}

&::-webkit-scrollbar-track {
  background: transparent; /* or a color if you want */
}
`

const tableStyle = css`
    width: 100%;
    font-weight: medium;
    border-collapse: separate;
    border-spacing: 0 8px;

  & {
    > tbody tr {
      height: 72px; /* Ensures it applies even when content is smaller */
    }

    > tbody tr td {
      margin-bottom: 10px; 
    }

    > tbody tr td:first-child {
      border-top-left-radius: 10px;
      border-bottom-left-radius: 10px;
      overflow: hidden;
    }
    > tbody tr td:last-child {
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;
      overflow: hidden;
    }
  }
`

const trStyle = ({ rolecolor }: { rolecolor: string }) => css`
    td {
      border-top: 1px solid ${rolecolor};
      border-bottom: 1px solid ${rolecolor};
    }
    td:last-child {
      border-right: 1px solid ${rolecolor};
    }
    td {
      input[type=checkbox] {
      border-color: ${rolecolor};

      &:checked {
        background-color: ${rolecolor};
      }
    }
`

/**
 * ------------------------------------------------------------------
 * Pagination
 * ------------------------------------------------------------------
 */
interface PaginationProps {
  dataListLength: number;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  maxPageNum: number;
}

/**
 * Pagination
 */
function Pagination({ props }: { props: PaginationProps }) {
  const { dataListLength, currentPage, setCurrentPage, maxPageNum } = props

  /**
   * totalPages
   */
  const totalPages = useMemo(() => Math.ceil(dataListLength / perPage), [dataListLength])

  /**
   * selectablePageOptions
   */
  const selectablePageOptions = useMemo(() => {
    if (maxPageNum === 1) {
      return [1]
    }
    if (maxPageNum === 2) {
      return [1, 2]
    }
    if (maxPageNum === 3) {
      return [1, 2, 3]
    }

    if (currentPage === 1) {
      return [1, 2, 3]
    } else if (currentPage === maxPageNum) {
      return [maxPageNum - 2, maxPageNum - 1, maxPageNum]
    } else {
      return [currentPage - 1, currentPage, currentPage + 1]
    }
  }, [currentPage, maxPageNum])

  /**
   * handlePrevious
   */
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
    }
  }, [currentPage, setCurrentPage])

  /**
   * handleNext
   */
  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
    }
  }, [currentPage, setCurrentPage, totalPages])

  /**
   * handleNext
   */
  const handlePageChange = useCallback((page: number) => () => setCurrentPage(page), [setCurrentPage])

  return (
    <nav className="flex items-center justify-center gap-x-2 px-4 my-6">
      {
        currentPage !== 1 && (
          <button
            className="group flex items-center border-t-2 border-transparent text-sm font-medium text-foreground"
            onClick={handlePrevious}
          >
            <ChevronLeftIcon
              aria-hidden="true"
              className="size-5 transform transition-transform duration-200 group-hover:-translate-x-1"
            />
            Previous
          </button>
        )
      }

      {
        !selectablePageOptions.includes(1) && (
          <OmitDots />
        )
      }

      <div class='flex gap-x-2'>
        {
          selectablePageOptions.map(num => {
            return (
              <button
                key={`button-${num}`}
                className={`w-[40px] h-[40px] rounded-md border border-input-border flex items-center justify-center transition-[.3] ${num === currentPage ? 'bg-input-border pointer-events-none' : 'hover:bg-input-border'}`} onClick={handlePageChange(num)}>{num}</button>
            )
          })
        }
      </div>

      {
        !selectablePageOptions.includes(maxPageNum) && (
          <OmitDots />
        )
      }

      {
        currentPage !== maxPageNum && (
          <button
            className="group flex items-center border-t-2 border-transparent pl-1 text-sm font-medium text-foreground"
            onClick={handleNext}
          >
            Next
            <ChevronRightIcon
              aria-hidden="true"
              className="size-5 transform transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        )
      }
    </nav>
  )
}

/**
 * 
 * @returns 
 */
function OmitDots() {
  return (
    <div className="flex items-center justify-center text-sm font-medium text-foreground transform -translate-y-[3px]">
      <span>...</span>
    </div>
  )
}