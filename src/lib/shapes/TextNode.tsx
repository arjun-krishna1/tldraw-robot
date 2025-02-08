import { BaseBoxShapeUtil } from '@tldraw/tldraw'
import { TextNodeShape } from '.'
import * as React from 'react'

export class TextNodeUtil extends BaseBoxShapeUtil<TextNodeShape> {
  static type = 'text_input'

  getDefaultProps(): TextNodeShape['props'] {
    return {
      title: 'Text',
      w: 200,
      h: 100,
      text: '',
    }
  }

  component(shape: TextNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }
    
    return (
      <div
        style={{
          width: bounds.width,
          height: bounds.height,
          backgroundColor: '#0ea5e9',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{shape.props.title}</div>
        <div
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '8px',
            minHeight: '40px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {shape.props.text || '<empty>'}
        </div>
      </div>
    )
  }

  indicator(shape: TextNodeShape) {
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