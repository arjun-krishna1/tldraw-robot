'use client'

import { Tldraw, useEditor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useCallback } from 'react'
import { customShapeUtils } from '@/lib/shapes/config'
import { Toolbar } from './Toolbar'

export default function TldrawComputer() {
  const handleMount = useCallback(() => {
    // Initialize any computer-specific functionality here
    console.log('Tldraw mounted')
  }, [])

  return (
    <div className="h-screen w-full relative">
      <Tldraw
        onMount={handleMount}
        shapeUtils={customShapeUtils}
        persistenceKey="tldraw-computer"
        className="h-full w-full"
      >
        <EditorToolbar />
      </Tldraw>
    </div>
  )
}

function EditorToolbar() {
  const editor = useEditor()
  return <Toolbar editor={editor} />
} 