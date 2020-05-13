import { defer } from 'lodash'
import html2canvas from 'html2canvas'
import FileSaver from 'file-saver'
import { NotePosition } from './types'
import config from './config.json'
export async function snapshot(
  options: {
    notes: { id: string; position: NotePosition }[]
    canvasElement: HTMLElement
    canvas: { x: number; y: number }
    viewPort: { x: number; y: number; width: number; height: number }
  },
  cb: () => void,
) {
  let [left, top, right, bottom] = [
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
  ]

  options.notes
    .map(note => note.position)
    .forEach(({ x, y }) => {
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x)
      bottom = Math.max(bottom, y)
    })

  let offsetX = options.canvas.x + options.viewPort.x
  let offsetY = options.canvas.y + options.viewPort.y
  const PADDING = 50
  const contentBox = {
    x: left + offsetX - PADDING,
    y: top + offsetY - PADDING,
    width: right - left + PADDING * 2 + config.note.width,
    height: bottom - top + PADDING * 2 + config.note.height,
  }

  let callbackInvoked = false
  const findNote = (id: string | undefined) =>
    options.notes.find(note => note.id === id)

  defer(async () => {
    const rendered = await html2canvas(options.canvasElement, {
      ...contentBox,
      onclone: doc => {
        cb()
        callbackInvoked = true
        doc.querySelectorAll('.note').forEach((el: Element) => {
          let htmlElement = el as HTMLElement
          const { x, y } = findNote(htmlElement.dataset.id)?.position ?? {
            x: 0,
            y: 0,
          }

          htmlElement.setAttribute(
            'style',
            htmlElement.style +
              `;position: absolute; left: ${-x}px; top: ${-y}px`,
          )
        })
        doc.querySelectorAll('.paper').forEach((el: Element) => {
          let htmlElement = el as HTMLElement
          htmlElement.setAttribute(
            'style',
            htmlElement.style +
              `; border-bottom: 1.5px solid #ccc; border-right: 1px solid #ddd;`,
          )
        })
      },
    })

    if (!callbackInvoked) cb()

    const fileName = `${new Date().toISOString().substr(0, 10)} - export.png`
    rendered.toBlob(function(blob) {
      FileSaver.saveAs(blob, fileName)
    })
  })
}
