import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation, Editor, TLShapeId, TLBinding } from '@tldraw/tldraw'
import { StartNodeShape } from '.'
import * as React from 'react'

function getShapesPointedToByShape(editor: Editor, sourceId: TLShapeId): TLShapeId[] {
  console.log('\n=== Finding next shapes from:', sourceId, '===')
  
  // Get all arrows in the editor
  const arrows = editor.getCurrentPageShapes().filter(shape => shape.type === 'arrow')
  console.log('Found arrows:', arrows)

  // Find arrows that start from our source shape
  const nextShapes = arrows
    .map(arrow => {
      const bindings = editor.getBindingsFromShape(arrow.id, 'arrow')
      
      console.log('Arrow:', arrow.id)
      console.log('- Bindings:', bindings)

      // Find start and end bindings
      const startBinding = bindings.find((b: TLBinding) => (b.props as any).terminal === 'start')
      const endBinding = bindings.find((b: TLBinding) => (b.props as any).terminal === 'end')

      // Check if this arrow starts from our source shape
      if (startBinding?.toId === sourceId && endBinding) {
        const targetShape = editor.getShape(endBinding.toId)
        console.log('Found connection to:', targetShape)
        return endBinding.toId
      }
      return null
    })
    .filter((id): id is TLShapeId => id !== null)

  console.log('Next shapes in sequence:', nextShapes)
  console.log('=== Finished finding next shapes ===\n')
  return nextShapes
}

async function triggerNode(editor: Editor, shapeId: TLShapeId, visited = new Set<string>()): Promise<void> {
  console.log('\n=== Triggering node:', shapeId, '===')
  
  // Prevent cycles
  if (visited.has(shapeId)) {
    console.log('Node already visited, skipping to prevent cycles')
    return
  }
  visited.add(shapeId)
  console.log('Current visited nodes:', Array.from(visited))

  // Get the shape
  const shape = editor.getShape(shapeId)
  console.log('Shape to trigger:', shape)
  if (!shape) {
    console.log('Shape not found, skipping')
    return
  }

  // Find the button element and click it
  console.log('Looking for button in shape:', shapeId)
  const element = document.querySelector(`[data-shape-id="${shapeId}"] button`) as HTMLButtonElement
  if (element) {
    console.log('Found button, clicking it')
    element.click()
    // Wait a bit for the action to complete
    console.log('Waiting for action to complete...')
    await new Promise(resolve => setTimeout(resolve, 1000))
  } else {
    console.log('No button found in shape')
  }

  // Get next shapes to trigger
  console.log('Finding next shapes in sequence')
  const nextShapes = getShapesPointedToByShape(editor, shapeId)
  console.log('Found next shapes:', nextShapes)
  
  // Trigger them in sequence
  for (const nextId of nextShapes) {
    console.log('Triggering next shape:', nextId)
    await triggerNode(editor, nextId, visited)
  }
  
  console.log('=== Finished triggering node:', shapeId, '===\n')
}

export class StartNodeUtil extends BaseBoxShapeUtil<StartNodeShape> {
  static type = 'start'

  getDefaultProps(): StartNodeShape['props'] {
    return {
      title: 'Start',
      w: 200,
      h: 100,
      isLoading: false,
    }
  }

  component(shape: StartNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }

    const handleStart = React.useCallback(async (e: React.MouseEvent) => {
      console.log('\n=== Start button clicked ===')
      e.stopPropagation()
      if (shape.props.isLoading) {
        console.log('Already running, ignoring click')
        return
      }

      // Update loading state
      console.log('Setting loading state...')
      this.editor?.updateShape<StartNodeShape>({
        id: shape.id,
        type: 'start',
        props: {
          ...shape.props,
          isLoading: true,
        },
      })

      try {
        console.log('Starting sequence from node:', shape.id)
        // Get and trigger all connected shapes
        await triggerNode(this.editor!, shape.id)
        console.log('Sequence completed successfully')

        // Update state
        console.log('Resetting loading state...')
        this.editor?.updateShape<StartNodeShape>({
          id: shape.id,
          type: 'start',
          props: {
            ...shape.props,
            isLoading: false,
          },
        })
      } catch (error) {
        console.error('Error in sequence:', error)
        this.editor?.updateShape<StartNodeShape>({
          id: shape.id,
          type: 'start',
          props: {
            ...shape.props,
            isLoading: false,
          },
        })
      }
      console.log('=== Start sequence finished ===\n')
    }, [shape])

    return (
      <HTMLContainer
        id={shape.id}
        onPointerDown={stopEventPropagation}
      >
        <div
          style={{
            width: bounds.width,
            height: bounds.height,
            backgroundColor: '#059669',
            borderRadius: '8px',
            padding: '12px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div 
            style={{ 
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {shape.props.title}
            <button
              onClick={handleStart}
              disabled={shape.props.isLoading}
              style={{
                backgroundColor: shape.props.isLoading ? '#047857' : '#10b981',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                color: 'white',
                cursor: shape.props.isLoading ? 'not-allowed' : 'pointer',
                pointerEvents: 'all',
              }}
            >
              {shape.props.isLoading ? 'Running...' : 'Start'}
            </button>
          </div>
          <div>
            Click Start to trigger all connected nodes in sequence
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: StartNodeShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
      />
    )
  }
} 