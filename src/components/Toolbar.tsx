import { Editor, createShapeId } from '@tldraw/tldraw'
import * as React from 'react'

interface ToolbarProps {
  editor: Editor
}

export function Toolbar({ editor }: ToolbarProps) {
  const addNode = React.useCallback((type: string) => {
    const id = createShapeId()
    editor.createShape({
      id,
      type,
      x: 100,
      y: 100,
    })
  }, [editor])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-row gap-2 bg-white p-2 rounded-lg shadow-lg">
      <button
        className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        onClick={() => addNode('start')}
      >
        Start
      </button>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => addNode('movement')}
      >
        Move
      </button>
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => addNode('speech')}
      >
        Talk
      </button>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => addNode('audio_input')}
      >
        Listen
      </button>
      <button
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        onClick={() => addNode('llm')}
      >
        Think
      </button>
      <button
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        onClick={() => addNode('status')}
      >
        Status
      </button>
    </div>
  )
} 