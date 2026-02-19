import { useState, useEffect } from 'react'

export type ApiState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: string }

/**
 * Generic fetch hook with cleanup (AbortController).
 * Interview tip: Always cancel in-flight requests when a component unmounts
 * to avoid "state update on unmounted component" memory leaks.
 */
export function useApi<T>(url: string, options?: RequestInit): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading', data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })

    fetch(url, { signal: controller.signal, ...options })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        return res.json() as Promise<T>
      })
      .then((data) => setState({ status: 'success', data, error: null }))
      .catch((err: Error) => {
        if (err.name === 'AbortError') return // intentional cancel, don't update state
        setState({ status: 'error', data: null, error: err.message })
      })

    return () => controller.abort()
  }, [url])

  return state
}
