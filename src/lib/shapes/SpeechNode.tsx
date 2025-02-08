import { BaseBoxShapeUtil } from '@tldraw/tldraw'
import { SpeechNodeShape } from '.'
import * as React from 'react'

export class SpeechNodeUtil extends BaseBoxShapeUtil<SpeechNodeShape> {
  static type = 'speech'

  getDefaultProps(): SpeechNodeShape['props'] {
    return {
      title: 'Talk',
      w: 200,
      h: 100,
      text: '',
    }
  }

  component(shape: SpeechNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }
    
    return (
      <div
        style={{
          width: bounds.width,
          height: bounds.height,
          backgroundColor: '#16a34a',
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
          Text: {shape.props.text || '<empty>'}
        </div>
      </div>
    )
  }

  indicator(shape: SpeechNodeShape) {
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