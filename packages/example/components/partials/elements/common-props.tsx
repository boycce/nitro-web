import { SelectProps, TableProps } from 'nitro-web'

type TableRowData = { [key: string]: unknown }

// Shared styling defaults for the nitro Select, spread on with <Select {...selectCommonProps} ... />
export const selectCommonProps: Partial<SelectProps> = {
  // classNames: {
  //   control: {
  //     base: 'shadow-button',
  //   },
  //   valueContainer: 'pr-[8px]',
  // },
}

// Shared styling defaults for the nitro Table, spread on with <Table {...tableCommonProps} ... />
export const tableCommonProps: Partial<TableProps<TableRowData>> = {
  className: 'w-max min-w-full rounded-lg ring-1 ring-inset ring-border-1 overflow-hidden',
  rowClassName: '[&:hover>div]:bg-primary/[0.03]',
  columnHeaderClassName: 'bg-primary/[0.03] text-primary font-semibold',
  columnClassName: 'border-border-1',
  columnClassNameFn: (col) => col.value === 'checkbox' ? 'w-[56px]' : '',
  headerHeightMin: 36,
  rowHeightMin: 40,
  columnPaddingX: 20,
}