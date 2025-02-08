import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation, useValue, createShapeId, RecordProps, T } from '@tldraw/tldraw'
import { LLMNodeShape } from '.'
import * as React from 'react'
import { generateWithGemini } from '../utils/gemini'

export class LLMNodeUtil extends BaseBoxShapeUtil<LLMNodeShape> {
  static type = 'llm'
  static props = {
    w: T.number,
    h: T.number,
    title: T.string,
    instruction: T.string,
    response: T.string,
    isLoading: T.boolean,
  }

  override canEdit() {
    return true
  }

  getDefaultProps(): LLMNodeShape['props'] {
    return {
      title: 'Think',
      w: 200,
      h: 100,
      instruction: 'Is this an animal?',
      response: '',
      isLoading: false,
    }
  }

  component(shape: LLMNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }

    const isEditing = this.editor.getEditingShapeId() === shape.id

    const handleThink = React.useCallback(async (e: React.MouseEvent) => {
      console.log('Think button clicked')
      console.log('Current instruction:', shape.props.instruction)
      
      e.stopPropagation()
      if (!shape.props.instruction || shape.props.isLoading) {
        console.log('Think aborted - no instruction or already loading')
        return
      }

      // Update loading state
      console.log('Setting loading state...')
      this.editor?.updateShape<LLMNodeShape>({
        id: shape.id,
        type: 'llm',
        props: {
          ...shape.props,
          isLoading: true,
        },
      })

      try {
        console.log('Calling Gemini API...')
        const response = await generateWithGemini(shape.props.instruction)
        console.log('Gemini response:', response)
        
        // Create or update result text shape
        const resultId = createShapeId()
        console.log('Creating result text shape...')
        this.editor?.createShape({
          id: resultId,
          type: 'text',
          x: shape.x,
          y: shape.y + shape.props.h + 50,
          props: {
            text: response,
            color: 'black',
            size: 'm',
            font: 'draw',
            scale: 1,
          },
        })

        // Update Think node state
        console.log('Updating Think node state...')
        this.editor?.updateShape<LLMNodeShape>({
          id: shape.id,
          type: 'llm',
          props: {
            ...shape.props,
            response,
            isLoading: false,
          },
        })
      } catch (error) {
        console.error('Error thinking:', error)
        this.editor?.updateShape<LLMNodeShape>({
          id: shape.id,
          type: 'llm',
          props: {
            ...shape.props,
            response: 'Error: Could not generate response',
            isLoading: false,
          },
        })
      }
    }, [shape])
    
    return (
      <HTMLContainer
        id={shape.id}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        style={{
          width: bounds.width,
          height: bounds.height,
          backgroundColor: '#9333ea',
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
            onClick={handleThink}
            disabled={!shape.props.instruction || shape.props.isLoading}
            style={{
              backgroundColor: shape.props.isLoading ? '#4c1d95' : '#7e22ce',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'white',
              cursor: shape.props.isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {shape.props.isLoading ? 'Thinking...' : 'Think'}
          </button>
        </div>
        <div>
          {isEditing ? (
            <input
              value={shape.props.instruction}
              onChange={(e) => {
                this.editor?.updateShape<LLMNodeShape>({
                  id: shape.id,
                  type: 'llm',
                  props: {
                    ...shape.props,
                    instruction: e.target.value,
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
          ) : (
            <div>{shape.props.instruction || '<empty>'}</div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: LLMNodeShape) {
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