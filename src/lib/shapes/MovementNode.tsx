import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation } from '@tldraw/tldraw'
import { MovementNodeShape } from '.'
import * as React from 'react'
import { sendMovementCommand } from '../utils/movement'

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

      // Update loading state
      this.editor?.updateShape<MovementNodeShape>({
        id: shape.id,
        type: 'movement',
        props: {
          ...shape.props,
          isLoading: true,
        },
      })

      try {
        const response = await sendMovementCommand(shape.props.direction, shape.props.value)
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
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={shape.props.direction}
                onChange={(e) => {
                  this.editor?.updateShape<MovementNodeShape>({
                    id: shape.id,
                    type: 'movement',
                    props: {
                      ...shape.props,
                      direction: e.target.value,
                    },
                  })
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  padding: '4px',
                  color: 'white',
                  borderRadius: '4px',
                }}
              >
                <option value="forward">Forward</option>
                <option value="back">Back</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
              <input
                type="number"
                value={shape.props.value}
                onChange={(e) => {
                  this.editor?.updateShape<MovementNodeShape>({
                    id: shape.id,
                    type: 'movement',
                    props: {
                      ...shape.props,
                      value: parseFloat(e.target.value) || 0,
                    },
                  })
                }}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  padding: '4px',
                  color: 'white',
                  borderRadius: '4px',
                }}
              />
            </div>
          ) : (
            <div>
              {/* TEST Direction: {shape.props.direction} */}
              <br />
              {/* Value: {shape.props.value} {shape.props.direction === 'left' || shape.props.direction === 'right' ? 'degrees' : 'cm'} */}
            </div>
          )}
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