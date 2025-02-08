import { BaseBoxShapeUtil, TLBaseShape, createShapeId } from '@tldraw/tldraw'

// Base shape interface for all nodes
export interface NodeShape extends TLBaseShape<string, {
  title: string
  w: number
  h: number
}> {}

// Text node
export interface TextNodeShape extends TLBaseShape<'text_input', {
  title: string
  w: number
  h: number
  text: string
}> {}

// Move node
export interface MovementNodeShape extends TLBaseShape<'movement', {
  title: string
  w: number
  h: number
  direction: 'forward' | 'backward' | 'turn'
  value: number // distance in cm or angle in degrees
}> {}

// Talk node
export interface SpeechNodeShape extends TLBaseShape<'speech', {
  title: string
  w: number
  h: number
  text: string
}> {}

// Listen node
export interface AudioInputNodeShape extends TLBaseShape<'audio_input', {
  title: string
  w: number
  h: number
  command: string
}> {}

// Think instruction node
export interface LLMNodeShape extends TLBaseShape<'llm', {
  title: string
  w: number
  h: number
  instruction: string
  response: string
  isLoading: boolean
}> {}

// Status node
export interface StatusNodeShape extends TLBaseShape<'status', {
  title: string
  w: number
  h: number
  status: 'idle' | 'moving' | 'speaking' | 'listening' | 'thinking'
}> {} 