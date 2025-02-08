import { BaseBoxShapeUtil } from '@tldraw/tldraw'
import { LLMNodeShape } from '.'
import * as React from 'react'

export class LLMNodeUtil extends BaseBoxShapeUtil<LLMNodeShape> {
  static type = 'llm'

  getDefaultProps(): LLMNodeShape['props'] {
    return {
      title: 'Think',
      w: 200,
      h: 100,
      instruction: '',
    }
  }

  component(shape: LLMNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }
    
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
        <div style={{ fontWeight: 'bold' }}>{shape.props.title}</div>
        <div>
          Instruction: {shape.props.instruction || '<empty>'}
        </div>
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