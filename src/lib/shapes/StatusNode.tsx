import { BaseBoxShapeUtil } from '@tldraw/tldraw'
import { StatusNodeShape } from '.'
import * as React from 'react'

export class StatusNodeUtil extends BaseBoxShapeUtil<StatusNodeShape> {
  static type = 'status'

  getDefaultProps(): StatusNodeShape['props'] {
    return {
      title: 'Status',
      w: 200,
      h: 100,
      status: 'idle',
    }
  }

  component(shape: StatusNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }
    
    const getStatusColor = (status: StatusNodeShape['props']['status']) => {
      switch (status) {
        case 'idle':
          return '#6b7280'
        case 'moving':
          return '#2563eb'
        case 'speaking':
          return '#16a34a'
        case 'listening':
          return '#dc2626'
        case 'thinking':
          return '#9333ea'
        default:
          return '#6b7280'
      }
    }

    return (
      <div
        style={{
          width: bounds.width,
          height: bounds.height,
          backgroundColor: getStatusColor(shape.props.status),
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
          Status: {shape.props.status}
        </div>
      </div>
    )
  }

  indicator(shape: StatusNodeShape) {
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