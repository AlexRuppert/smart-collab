import { sortBy } from 'lodash'
export class TextWidth {
  static canvasContext = document.createElement('canvas').getContext('2d')

  static measure(text, font) {
    TextWidth.canvasContext!.font = font
    return TextWidth.canvasContext!.measureText(text).width
  }
}
interface BestFitOptions {
  baseFontSize: number
  dimensions: number
  padding: number
}

export class BestFit {
  static getFit(value: string, options: BestFitOptions) {
    if (value.length <= 0) {
      return {
        value: '',
        scale: 1,
      }
    }

    const contentSplit = value
      .split(/\s/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    const content = contentSplit.join(' ')

    let multiLines = ['', '', '', '', '']
      .map((el, i) => {
        let limit = content.length / (i + 1)

        let row = ''
        let k = 0
        let text = ''
        while (k < contentSplit.length) {
          while (row.length < limit && k < contentSplit.length) {
            row += ' ' + contentSplit[k++]
            row = row.trim()
          }
          text += row + '\n'
          row = ''
        }
        return text.trim().split('\n')
      })
      .map(multi => {
        let maxWidth = Math.max(
          ...multi.map(line =>
            TextWidth.measure(
              line,
              options.baseFontSize + 'px "Caveat", Arial Narrow, serif',
            ),
          ),
        )
        let maxHeight = options.baseFontSize * 1.1 * multi.length

        return {
          value: multi.join('\n'),
          maxDim: Math.max(maxWidth, maxHeight),
        }
      })
    const best = sortBy(multiLines, 'maxDim')[0] as typeof multiLines[0]

    return {
      value: best.value,
      scale: (options.dimensions - options.padding * 2) / best.maxDim,
    }
  }
}
