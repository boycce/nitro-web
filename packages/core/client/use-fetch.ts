// Generally we avoid using external hooks inline with FP principles, except in rare cases
import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { request, showError, getResponseErrors, setTimeoutPromise } from 'nitro-web/util'
import { Errors, SharedCollection } from 'nitro-web/types'
import { injectedConfig } from 'nitro-web'

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000
const delay = () => injectedConfig.env === 'development' ? 0 : 0 // read lazily to avoid circular dependency
const delaySharedCollection = () => injectedConfig.env === 'development' ? 0 : 0 // read lazily to avoid circular dependency

// Typed from the project's useTracked global, i.e. the project's Store
type Store = ReturnType<typeof useTracked>[0]
type SharedCollections = NonNullable<Store['sharedCollections']>
type Col = SharedCollection<{ _id?: string }>
const emptyCol: Col = { rows: [], total: 0 }
type GetSharedCollectionFn = (prev: Col) => Col

type CollectionReturn<T> = {
  rows: T[],
  total: number,
  errors?: Errors,
  isLoading: boolean,
  refetch: () => void,
  setRows: React.Dispatch<React.SetStateAction<T[]>>
}
type DocumentReturn<T> = {
  data?: T,
  errors?: Errors,
  isLoading: boolean,
  refetch: () => void,
  setData: React.Dispatch<React.SetStateAction<T>>
}

/** Fetches a document */
export function useFetchDoc<T>(endpoint?: string, queryString?: string) {
  return useFetchResource<T>(endpoint, queryString || '', true) as DocumentReturn<T>
}

/** Fetches a collection */
export function useFetchCol<T>(endpoint?: string, queryString?: string) {
  return useFetchResource<T>(endpoint, queryString) as CollectionReturn<T>
}

/** Fetches a shared collection (e.g. options), which is cached on the store */
export function useFetchSharedCol<K extends keyof SharedCollections>(endpoint: string | undefined, collectionKey: K) {
  const [{ sharedCollections }, setStore] = useTracked()
  const { rows: rows2, total, errors, isLoading, lastFetched = 0 } = (sharedCollections?.[collectionKey] ?? emptyCol) as Col
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let mounted = true

    ;(async function () {
      try {
        const cacheFresh = Date.now() - lastFetched < CACHE_DURATION
        if (!endpoint || isLoading || (refreshCount === 0 && cacheFresh)) return
        setResource((prev) => ({ ...prev, isLoading: true, errors: [] }))
        const { rows, total } = await request(`get /api${endpoint}`)
        if (delaySharedCollection()) await setTimeoutPromise(() => {}, delaySharedCollection())
        if (!mounted) return
        setResource((prev) => ({ ...prev, rows: rows, total: total, isLoading: false, lastFetched: Date.now(), errors: [] }))
      } catch (error) {
        if (!mounted) return
        showError(setStore, error)
        setResource((prev) => ({ ...prev, isLoading: false, lastFetched: Date.now(), errors: getResponseErrors(error) }))
      }
    })()

    return () => {
      mounted = false
    }
  }, [refreshCount, collectionKey, endpoint])

  function refetch() {
    setRefreshCount(prev => prev + 1)
  }

  function setResource(getSharedCollectionFn: GetSharedCollectionFn) {
    setStore((prev) => ({
      ...prev,
      sharedCollections: {
        ...prev.sharedCollections,
        [collectionKey]: getSharedCollectionFn((prev.sharedCollections?.[collectionKey] ?? emptyCol) as Col),
      },
    }))
  }

  const rows = rows2 as SharedCollections[K]['rows']
  return { rows, total, errors, isLoading, refetch }
}

/** Base hook to fetch a collection or document (does not persist the data in the data-store) */
function useFetchResource<T>(endpoint?: string, queryString?: string, isDocument?: boolean) {
  const [, setStore] = useTracked()
  const [rows, setRows] = useState<T[]>([])
  const [data, setData] = useState<T | undefined>()
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState<Errors>([])
  const [isLoading, setIsLoading] = useState(!!endpoint)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let mounted = true

    ;(async function () {
      try {
        if (!endpoint) return
        setIsLoading(true)
        const response = await request(`get /api${endpoint}${queryString}`)
        if (delay()) await setTimeoutPromise(() => {}, delay())
        if (mounted) {
          if (isDocument) {
            setData(response || undefined)
          } else {
            setRows(response.rows || [])
            setTotal(response.total || 0)
          }
          setErrors([])
          setIsLoading(false)
        }
      } catch (error) {
        if (mounted) {
          showError(setStore, error)
          setErrors(getResponseErrors(error))
          setIsLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [refreshCount, endpoint, queryString])

  function refetch() {
    setRefreshCount(prev => prev + 1)
  }

  return isDocument === true ? { data, errors, isLoading, refetch, setData } : { rows, total, errors, isLoading, refetch, setRows }
}

/** Clears a shared collection's cache (without refetching). Optionally appends an item immediately. */
export function clearCache<K extends keyof SharedCollections>(
  setStore: Dispatch<SetStateAction<Store>>,
  collectionKey: K,
  append?: SharedCollections[K]['rows'][number]
) {
  setStore((prev) => {
    const col = (prev.sharedCollections?.[collectionKey] ?? emptyCol) as Col
    const id = (append as Col['rows'][number] | undefined)?._id
    return {
      ...prev,
      sharedCollections: {
        ...prev.sharedCollections,
        [collectionKey]: {
          ...col,
          rows: append && !col.rows.some((r) => r._id === id) ? [...col.rows, append as Col['rows'][number]] : col.rows,
          lastFetched: 0,
        },
      },
    }
  })
}
