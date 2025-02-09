'use client'

import { Tldraw, useEditor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useCallback, useState } from 'react'
import { customShapeUtils } from '@/lib/shapes/config'
import { Toolbar } from './Toolbar'
import { DesignMarketplace } from './DesignMarketplace'

export default function TldrawComputer() {
  const [showMarketplace, setShowMarketplace] = useState(false)

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
        <TldrawUI showMarketplace={showMarketplace} setShowMarketplace={setShowMarketplace} />
      </Tldraw>
    </div>
  )
}

interface TldrawUIProps {
  showMarketplace: boolean
  setShowMarketplace: (show: boolean) => void
}

function TldrawUI({ showMarketplace, setShowMarketplace }: TldrawUIProps) {
  const editor = useEditor()

  return (
    <>
      <Toolbar editor={editor} onOpenMarketplace={() => setShowMarketplace(true)} />
      
      {showMarketplace && (
        <DesignMarketplace
          editor={editor}
          onClose={() => setShowMarketplace(false)}
        />
      )}
    </>
  )
} 