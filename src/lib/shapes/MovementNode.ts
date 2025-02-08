import { BaseBoxShapeUtil, TLBaseShape, Vec2d } from '@tldraw/tldraw'
import { MovementNodeShape } from '.'

export class MovementNodeUtil extends BaseBoxShapeUtil<MovementNodeShape> {
  static type = 'movement'

  getDefaultProps(): MovementNodeShape['props'] {
    return {
      title: 'Move',
      w: 200,
      h: 100,
      direction: 'forward',
      value: 0,
    }
  }

  component(shape: MovementNodeShape) {
    const bounds = this.bounds(shape)
    
    return (
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
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{shape.props.title}</div>
        <div>
          Direction: {shape.props.direction}
          <br />
          Value: {shape.props.value} {shape.props.direction === 'turn' ? 'degrees' : 'cm'}
        </div>
      </div>
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