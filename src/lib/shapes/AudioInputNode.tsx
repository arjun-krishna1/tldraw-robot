import { BaseBoxShapeUtil } from '@tldraw/tldraw'
import { AudioInputNodeShape } from '.'
import * as React from 'react'

export class AudioInputNodeUtil extends BaseBoxShapeUtil<AudioInputNodeShape> {
  static type = 'audio_input'

  getDefaultProps(): AudioInputNodeShape['props'] {
    return {
      title: 'Listen',
      w: 200,
      h: 100,
      command: '',
    }
  }

  component(shape: AudioInputNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }
    
    return (
      <div
        style={{
          width: bounds.width,
          height: bounds.height,
          backgroundColor: '#dc2626',
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
          Command: {shape.props.command || '<listening>'}
        </div>
      </div>
    )
  }

  indicator(shape: AudioInputNodeShape) {
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