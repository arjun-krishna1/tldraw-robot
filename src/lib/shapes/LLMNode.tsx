import { BaseBoxShapeUtil } from '@tldraw/tldraw'
import { LLMNodeShape } from '.'
import * as React from 'react'
import { generateWithGemini } from '../utils/gemini'

export class LLMNodeUtil extends BaseBoxShapeUtil<LLMNodeShape> {
  static type = 'llm'

  getDefaultProps(): LLMNodeShape['props'] {
    return {
      title: 'Think',
      w: 200,
      h: 100,
      instruction: '',
      response: '',
      isLoading: false,
    }
  }

  component(shape: LLMNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }

    const handleThink = React.useCallback(async () => {
      if (!shape.props.instruction || shape.props.isLoading) return

      // Update loading state
      this.editor?.updateShape<LLMNodeShape>({
        id: shape.id,
        type: 'llm',
        props: {
          ...shape.props,
          isLoading: true,
        },
      })

      try {
        const response = await generateWithGemini(shape.props.instruction)
        
        // Update with response
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
    }, [shape.props.instruction])
    
    return (
      <div
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
        }}
      >
        <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          Instruction: {shape.props.instruction || '<empty>'}
        </div>
        {shape.props.response && (
          <div style={{ marginTop: '4px', padding: '4px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
            Response: {shape.props.response}
          </div>
        )}
      </div>
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