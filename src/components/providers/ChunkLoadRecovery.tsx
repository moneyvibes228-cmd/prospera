'use client'

import { useEffect } from 'react'

const RELOAD_KEY = 'prospera_dev_chunk_reload'

function isChunkLoadError(reason: unknown): boolean {
  if (!reason) return false
  const message = reason instanceof Error ? reason.message : String(reason)
  const name = reason instanceof Error ? reason.name : ''
  return (
    name === 'ChunkLoadError' ||
    message.includes('ChunkLoadError') ||
    message.includes('Failed to load chunk') ||
    message.includes('Loading chunk') ||
    message.includes('Failed to load script')
  )
}

/** Recharge une fois en dev si Turbopack invalide un chunk pendant la navigation. */
export function ChunkLoadRecovery() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const reloadOnce = () => {
      if (sessionStorage.getItem(RELOAD_KEY)) return
      sessionStorage.setItem(RELOAD_KEY, '1')
      window.location.reload()
    }

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error ?? event.message)) {
        event.preventDefault()
        reloadOnce()
      }
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        event.preventDefault()
        reloadOnce()
      }
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)

    const clearFlag = window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_KEY)
    }, 8000)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      window.clearTimeout(clearFlag)
    }
  }, [])

  return null
}
