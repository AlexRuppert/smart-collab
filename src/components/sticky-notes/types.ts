export enum PaperColors {
  yellow = 'yellow',
  blue = 'blue',
  green = 'green',
  red = 'red',
  orange = 'orange',
  white = 'white',
  purple = 'purple',
}

export enum InkColors {
  black = 'black',
  blue = 'blue',
  green = 'green',
  red = 'red',
  purple = 'purple',
}

export enum NoteTypes {
  default,
  noteCreation,
}

export interface NotePosition {
  x: number
  y: number
  rotation: number
}

export enum NoteUpdateEventTypes {
  create = 'create',
  delete = 'delete',
  dragStart = 'dragStart',
  dragEnd = 'dragEnd',
  move = 'move',
  tap = 'tap',
  input = 'input',
  color = 'color',
}

export enum SyncEventTypes {
  create = 'create',
  delete = 'delete',
  update = 'update',
  pointerMove = 'pointerMove',
}

export interface NoteParameters {
  id: string
  value?: string
  color: { paper: PaperColors; ink: InkColors }
  type?: NoteTypes
  zIndex: number
  isCrumbled?: boolean
  position: {
    x: number
    y: number
    rotation: number
  }
}

export interface PointerParameters {
  id: string
  lastUpdate: number
  user: {
    name: string
    color: string
  }
  position: {
    x: number
    y: number
  }
}

export enum ToolTypes {
  hand,
  bucket,
  pen,
}

interface Swatch {
  name: string
  color: string
}

export interface ToolStatus {
  bucket: { swatch: Swatch }
  pen: { swatch: Swatch }
}
