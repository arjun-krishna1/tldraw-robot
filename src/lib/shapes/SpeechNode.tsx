import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation, createShapeId, Editor, TLShapeId } from '@tldraw/tldraw'
import { SpeechNodeShape } from '.'
import * as React from 'react'
import { textToSpeech } from '../utils/elevenlabs'

function getTextPointingToShape(editor: Editor, targetShapeId: TLShapeId): string[] {
  // Get all bindings where this shape is the target
  const bindings = editor.getBindingsToShape(targetShapeId, 'arrow')
  
  // For each binding, get both the arrow and the shape it's coming from
  return bindings.map(binding => {
    // Get the arrow shape
    const arrowShape = editor.getShape(binding.fromId)
    if (!arrowShape || arrowShape.type !== 'arrow') return null

    // Get the arrow's bindings to find its start point
    const arrowBindings = editor.getBindingsFromShape(arrowShape.id, 'arrow')
    
    // Find the binding that represents the start of the arrow
    const startBinding = arrowBindings.find(b => (b.props as any).terminal === 'start')
    if (!startBinding) return null

    // Get the shape at the start of the arrow
    const startShape = editor.getShape(startBinding.toId)
    if (!startShape) return null
    
    // Get the text from the source shape
    const text = editor.getShapeUtil(startShape).getText(startShape)
    return text
  }).filter((text): text is string => text !== null && text !== undefined)
}

export class SpeechNodeUtil extends BaseBoxShapeUtil<SpeechNodeShape> {
  static type = 'speech'

  getDefaultProps(): SpeechNodeShape['props'] {
    return {
      title: 'Talk',
      w: 200,
      h: 100,
      text: '',
      isLoading: false,
    }
  }

  component(shape: SpeechNodeShape) {
    const bounds = {
      width: shape.props.w,
      height: shape.props.h,
    }

    const handleSpeak = React.useCallback(async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (shape.props.isLoading) return

      // Get connected text content
      const connectedTexts = getTextPointingToShape(this.editor!, shape.id)
      const textToSpeak = connectedTexts.join('\n')

      if (!textToSpeak) {
        console.log('No text to speak')
        return
      }

      // Update loading state
      this.editor?.updateShape<SpeechNodeShape>({
        id: shape.id,
        type: 'speech',
        props: {
          ...shape.props,
          isLoading: true,
          text: textToSpeak,
        },
      })

      try {
        // Get audio data
        const audioData = await textToSpeech(textToSpeak)
        
        // Create audio context and play
        const audioContext = new AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(audioData)
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioContext.destination)
        source.start()

        // Update state
        this.editor?.updateShape<SpeechNodeShape>({
          id: shape.id,
          type: 'speech',
          props: {
            ...shape.props,
            isLoading: false,
          },
        })
      } catch (error) {
        console.error('Error speaking:', error)
        this.editor?.updateShape<SpeechNodeShape>({
          id: shape.id,
          type: 'speech',
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
            onClick={handleSpeak}
            disabled={shape.props.isLoading}
            style={{
              backgroundColor: shape.props.isLoading ? '#15803d' : '#22c55e',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'white',
              cursor: shape.props.isLoading ? 'not-allowed' : 'pointer',
              pointerEvents: 'all',
            }}
          >
            {shape.props.isLoading ? 'Speaking...' : 'Speak'}
          </button>
        </div>
        <div>
          Text: {shape.props.text || '<Connect text to speak>'}
        </div>
      </HTMLContainer>
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