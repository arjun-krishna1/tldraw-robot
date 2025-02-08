'use client'

import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useCallback } from 'react'

export default function TldrawComputer() {
  const handleMount = useCallback(() => {
    // Initialize any computer-specific functionality here
    console.log('Tldraw mounted')
  }, [])

  return (
    <div className="h-screen w-full">
      <Tldraw
        onMount={handleMount}
        persistenceKey="tldraw-computer"
        className="h-full w-full"
      />
    </div>
  )
} 