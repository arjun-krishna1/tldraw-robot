import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation, Editor, TLShapeId } from '@tldraw/tldraw'
import { MovementNodeShape } from '.'
import * as React from 'react'
import { sendMovementCommand } from '../utils/movement'

function getTextPointingToShape(editor: Editor, targetShapeId: TLShapeId): string[] {
  // Get all bindings where this shape is the target
  const bindings = editor.getBindingsToShape(targetShapeId, 'arrow')
  
  // For each binding, get both the arrow and the shape it's coming from
  return bindings.map(binding => {
    // Get the arrow shape
    const arrowShape = editor.getShape(binding.fromId)
    if (!arrowShape || arrowShape.type !== 'arrow') return null

    // Get the arrow's bindings to find its start point
    const arrowBindings = editor.getBindingsFromShape(arrowShape.id, 'arrow')
    
    // Find the binding that represents the start of the arrow
    const startBinding = arrowBindings.find(b => (b.props as any).terminal === 'start')
    if (!startBinding) return null

    // Get the shape at the start of the arrow
    const startShape = editor.getShape(startBinding.toId)
    if (!startShape) return null
    
    // Get the text from the source shape
    const text = editor.getShapeUtil(startShape).getText(startShape)
    return text
  }).filter((text): text is string => text !== null && text !== undefined)
}

function parseMovementCommand(text: string): { direction: string; value: number } | null {
  // // Try to match patterns like "forward 10", "left 90", etc.
  // console.log('ARJUN LOG TEXT', text)
  // const match = text.toLowerCase().match(/(forward|back|left|right)\s+(\d+)/i)
  // if (match) {
    return {
      direction: text,
      value: 10
    }
  // }
  // return null
}

/** @public */
export class MovementNodeUtil extends BaseBoxShapeUtil<MovementNodeShape> {
  static type = 'movement'

  override canEdit() {
    return true
  }

  getDefaultProps(): MovementNodeShape['props'] {
    return {
      title: 'Move',
      w: 200,
      h: 140,
      direction: 'forward',
      value: 0,
      isLoading: false,
    }
  }

  component(shape: MovementNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }

    const isEditing = this.editor.getEditingShapeId() === shape.id

    const handleMove = React.useCallback(async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (shape.props.isLoading) return

      // Get connected text content
      const connectedTexts = getTextPointingToShape(this.editor!, shape.id)
      console.log('Connected texts:', connectedTexts)

      // Parse the last movement command
      const lastCommand = connectedTexts
        .map(text => parseMovementCommand(text))
        .filter((cmd): cmd is { direction: string; value: number } => cmd !== null)
        .pop()

      if (!lastCommand) {
        console.log('No valid movement command found')
        return
      }

      console.log('Executing movement command:', lastCommand)

      // Update loading state
      this.editor?.updateShape<MovementNodeShape>({
        id: shape.id,
        type: 'movement',
        props: {
          ...shape.props,
          direction: lastCommand.direction,
          value: lastCommand.value,
          isLoading: true,
        },
      })

      try {
        const response = await sendMovementCommand(lastCommand.direction, lastCommand.value)
        console.log('Movement response:', response)

        // Update node state
        this.editor?.updateShape<MovementNodeShape>({
          id: shape.id,
          type: 'movement',
          props: {
            ...shape.props,
            isLoading: false,
          },
        })
      } catch (error) {
        console.error('Error moving:', error)
        this.editor?.updateShape<MovementNodeShape>({
          id: shape.id,
          type: 'movement',
          props: {
            ...shape.props,
            isLoading: false,
          },
        })
      }
    }, [shape])

    // Get current movement command from connected text
    const connectedTexts = getTextPointingToShape(this.editor!, shape.id)
    const currentCommand = connectedTexts
      .map(text => parseMovementCommand(text))
      .filter((cmd): cmd is { direction: string; value: number } => cmd !== null)
      .pop()

    return (
      <HTMLContainer
        id={shape.id}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
      >
        <div
          style={{
            width: bounds.width,
            height: bounds.height,
            backgroundColor: '#2563eb',
            borderRadius: '8px',
            padding: '12px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: isEditing ? 'all' : 'none',
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
              onClick={handleMove}
              disabled={shape.props.isLoading}
              style={{
                backgroundColor: shape.props.isLoading ? '#1e40af' : '#3b82f6',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                color: 'white',
                cursor: shape.props.isLoading ? 'not-allowed' : 'pointer',
                pointerEvents: 'all',
              }}
            >
              {shape.props.isLoading ? 'Moving...' : 'Move'}
            </button>
          </div>
          <div>
            {currentCommand ? (
              <>
                Direction: {currentCommand.direction}
                <br />
                Value: {currentCommand.value} {currentCommand.direction === 'left' || currentCommand.direction === 'right' ? 'degrees' : 'cm'}
              </>
            ) : (
              'Connect a text node with commands like "forward 10" or "left 90"'
            )}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: MovementNodeShape) {
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