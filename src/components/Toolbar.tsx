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
    <div className="absolute top-4 left-4 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => addNode('movement')}
      >
        Add Movement
      </button>
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => addNode('speech')}
      >
        Add Speech
      </button>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => addNode('audio_input')}
      >
        Add Audio Input
      </button>
      <button
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        onClick={() => addNode('llm')}
      >
        Add LLM
      </button>
      <button
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        onClick={() => addNode('status')}
      >
        Add Status
      </button>
    </div>
  )
} 