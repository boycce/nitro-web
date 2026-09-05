import { Fragment, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  date, Initials, Pagination as BasePagination, PaginationProps, queryObject, Table, TableColumn, Topbar, useFetchCol,
  useFetchSharedCol,
} from 'nitro-web'
import { Button, tableCommonProps } from '../partials/elements'
import { perPage } from '../../server/constants'
import { mockEmployees, mockRoles, pageOf } from './employees.mock'
import type { Employee, Role } from 'types'

const thead: TableColumn[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'startedAt', label: 'Started' },
]

export const EmployeesPage = () => {
  const location = useLocation()
  const [{ apiAvailable }] = useTracked()
  const actionClassName = 'h-[22px] px-[7px] !text-[11px]'

  const { rows, total, isLoading } = useFetchCol<Employee>(apiAvailable ? '/employees' : undefined, location.search)
  const { rows: roles } = useFetchSharedCol(apiAvailable ? '/employees/roles' : undefined, 'roleOptions')
  // Client-only fallback (npm run dev:client-only), the mock prefix makes it clear below these may be mocks
  const { mockRows, mockTotal, mockRoleRows } = withMocks(apiAvailable, { rows, total, roles }, location.search)

  return (
    <Fragment>
      <Topbar title="Employees" subtitle={`A basic index table page, ${apiAvailable ? 'from the API' : 'with mock data'}`} />

      <Table
        {...tableCommonProps}
        generateCheckboxActions={useCallback((selectedRowIds: string[]) => (
          <div className="flex items-center gap-x-2">
            <Button size="xs" color="dark" className={actionClassName} onClick={() => console.log('set', selectedRowIds)}>
              Set Role
            </Button>
            <Button size="xs" color="dark" className={actionClassName} onClick={() => console.log('remove', selectedRowIds)}>
              Delete
            </Button>
          </div>
        ), [])}
        columns={thead}
        rows={mockRows}
        isLoading={isLoading}
        generateTd={useCallback((col: TableColumn, row: Employee) => {
          switch (col.value) {
            case 'name':
              return (
                <div className="flex items-center gap-3.5">
                  <Initials
                    initials={row.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    size="small"
                    className="text-[9px]"
                    isRound
                  />
                  {row.name}
                </div>
              )
            case 'email':
              return <div>{row.email}</div>
            case 'role':
              return <div>{mockRoleRows.find(r => r._id === row.role)?.name || row.role}</div>
            case 'startedAt':
              return <div>{date(row.startedAt)}</div>
            default:
              return null
          }
        }, [mockRoleRows])}
      />

      <TableFooter>
        <Pagination total={mockTotal} />
      </TableFooter>
    </Fragment>
  )
}
EmployeesPage.route = {
  '/employees': true,
  'meta': { 'title': 'Employees', layout: 1 },
}

function withMocks(apiAvailable: boolean | undefined, data: { rows: Employee[], total: number, roles: Role[] }, search: string) {
  // Returns the fetched values, or the mocks when there is no API
  if (apiAvailable) return { mockRows: data.rows, mockTotal: data.total, mockRoleRows: data.roles }
  return {
    mockRows: pageOf(mockEmployees, perPage, queryObject(search).page as string),
    mockTotal: mockEmployees.length,
    mockRoleRows: mockRoles,
  }
}

function Pagination(props: PaginationProps) {
  return <BasePagination perPage={perPage} elements={{ Button }} {...props} />
}

function TableFooter({ children }: { children: React.ReactNode }) {
  // Row under the table, e.g. for <Pagination />
  return (
    <div className="mt-[18px] flex items-center justify-end">
      {children}
    </div>
  )
}
