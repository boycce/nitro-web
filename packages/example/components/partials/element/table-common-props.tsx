import { TableProps } from 'nitro-web'

type TableRowData = { [key: string]: unknown }

// Shared styling defaults for the nitro Table, spread on with <Table {...tableCommonProps} ... />
export const tableCommonProps: Partial<TableProps<TableRowData>> = {
  addOverflowScroll: true,
  className: 'flex-1 ring-1 ring-border-1 ring-inset',
  rowClassName: '[&:hover>div]:bg-gray-50',
  columnHeaderClassName: 'text-grey-1 text-sm',
  columnClassName: 'text-base border-border-1',
  scrollContainerClassName: 'min-h-full',
  rowLinesMax: 1,
}
