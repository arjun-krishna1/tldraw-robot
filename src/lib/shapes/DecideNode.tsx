import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation, Editor, TLShapeId, TLTextShape } from '@tldraw/tldraw'
import { DecideNodeShape } from '.'
import * as React from 'react'

function getInputText(editor: Editor, shapeId: TLShapeId): string[] {
  console.log('\n=== Getting input text for:', shapeId, '===')
  // Get all bindings where this shape is the target
  const bindings = editor.getBindingsToShape(shapeId, 'arrow')
  console.log('Found input bindings:', bindings)
  
  const texts = bindings.map(binding => {
    const arrowShape = editor.getShape(binding.fromId)
    console.log('Arrow shape:', arrowShape)
    if (!arrowShape || arrowShape.type !== 'arrow') return null

    const arrowBindings = editor.getBindingsFromShape(arrowShape.id, 'arrow')
    console.log('Arrow bindings:', arrowBindings)
    const startBinding = arrowBindings.find(b => (b.props as any).terminal === 'start')
    console.log('Start binding:', startBinding)
    if (!startBinding) return null

    const startShape = editor.getShape(startBinding.toId)
    console.log('Start shape:', startShape)
    if (!startShape) return null
    
    const text = editor.getShapeUtil(startShape).getText(startShape)
    console.log('Found input text:', text)
    return text?.toLowerCase().trim()
  }).filter((text): text is string => text !== null)

  console.log('Final input texts:', texts)
  console.log('=== Finished getting input text ===\n')
  return texts
}

function getOutputShapes(editor: Editor, sourceId: TLShapeId): { id: TLShapeId; text: string }[] {
  console.log('\n=== Getting output shapes for:', sourceId, '===')
  const arrows = editor.getCurrentPageShapes().filter(shape => shape.type === 'arrow')
  console.log('Found arrows:', arrows)

  const outputs = arrows
    .map(arrow => {
      const bindings = editor.getBindingsFromShape(arrow.id, 'arrow')
      console.log('Arrow bindings:', bindings)

      const startBinding = bindings.find((b) => (b.props as any).terminal === 'start')
      const endBinding = bindings.find((b) => (b.props as any).terminal === 'end')

      // Check if this arrow starts from our source shape
      if (startBinding?.toId === sourceId && endBinding) {
        const targetShape = editor.getShape(endBinding.toId)
        console.log('Found output shape:', targetShape)
        if (!targetShape) return null

        const text = editor.getShapeUtil(targetShape).getText(targetShape)?.toLowerCase().trim()
        if (!text) return null

        return { id: targetShape.id, text }
      }
      return null
    })
    .filter((output): output is { id: TLShapeId; text: string } => output !== null)

  console.log('Final output shapes:', outputs)
  console.log('=== Finished getting output shapes ===\n')
  return outputs
}

export class DecideNodeUtil extends BaseBoxShapeUtil<DecideNodeShape> {
  static type = 'decide'

  getDefaultProps(): DecideNodeShape['props'] {
    return {
      title: 'Decide',
      w: 200,
      h: 100,
      isLoading: false,
    }
  }

  component(shape: DecideNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }

    const handleDecide = React.useCallback(async (e: React.MouseEvent) => {
      console.log('\n=== Decide Button Clicked ===')
      e.stopPropagation()
      
      if (shape.props.isLoading) {
        console.log('Already deciding, ignoring click')
        return
      }

      // Update loading state
      console.log('Setting loading state...')
      this.editor?.updateShape<DecideNodeShape>({
        id: shape.id,
        type: 'decide',
        props: {
          ...shape.props,
          isLoading: true,
        },
      })

      try {
        // Get input text
        const inputTexts = getInputText(this.editor!, shape.id)
        console.log('Input texts:', inputTexts)

        // Check if input is exactly 'left' or 'right'
        const hasLeft = inputTexts.some(text => text === 'left')
        const hasRight = inputTexts.some(text => text === 'right')

        // Get output shapes and their text
        const outputs = getOutputShapes(this.editor!, shape.id)
        console.log('Output shapes:', outputs)

        // Update matching outputs - only one branch will be taken
        if (hasLeft) {
          console.log('Input is "left", triggering left branches')
          outputs
            .filter(output => output.text === 'left')
            .forEach(output => {
              this.editor?.updateShape<TLTextShape>({
                id: output.id,
                type: 'text',
                props: {
                  ...this.editor?.getShape(output.id)?.props,
                  text: 'started',
                },
              })
            })
        } else if (hasRight) {
          console.log('Input is "right", triggering right branches')
          outputs
            .filter(output => output.text === 'right')
            .forEach(output => {
              this.editor?.updateShape<TLTextShape>({
                id: output.id,
                type: 'text',
                props: {
                  ...this.editor?.getShape(output.id)?.props,
                  text: 'started',
                },
              })
            })
        } else {
          console.log('No valid input ("left" or "right") found')
        }

        // Reset loading state
        console.log('Resetting loading state...')
        this.editor?.updateShape<DecideNodeShape>({
          id: shape.id,
          type: 'decide',
          props: {
            ...shape.props,
            isLoading: false,
          },
        })
      } catch (error) {
        console.error('Error in decide:', error)
        this.editor?.updateShape<DecideNodeShape>({
          id: shape.id,
          type: 'decide',
          props: {
            ...shape.props,
            isLoading: false,
          },
        })
      }
      console.log('=== Decide sequence finished ===\n')
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
            backgroundColor: '#9333ea', // Purple color
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
              onClick={handleDecide}
              disabled={shape.props.isLoading}
              style={{
                backgroundColor: shape.props.isLoading ? '#7e22ce' : '#a855f7',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                color: 'white',
                cursor: shape.props.isLoading ? 'not-allowed' : 'pointer',
                pointerEvents: 'all',
              }}
            >
              {shape.props.isLoading ? 'Deciding...' : 'Decide'}
            </button>
          </div>
          <div>
            Branches based on "left" or "right" input
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: DecideNodeShape) {
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