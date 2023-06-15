const DefaultPatchGrammar = {
  rowDelimiter: "...",
  columnDelimiter: "~",
  encodedRowDelimiter: "%2E%2E%2E",
  encodedColumnDelimiter: "%7E",
}
class Patch {
  constructor(patchInput = "", grammar = DefaultPatchGrammar) {
    // The pipeline of encodings. Operations will be run in order for encoding (and reveresed for decoding).
    this.encoders = [
      {
        encode: (str) => encodeURIComponent(str),
        decode: (str) => decodeURIComponent(str),
      },
      {
        encode: (str) =>
          replaceAll(
            str,
            this.grammar.columnDelimiter,
            this.grammar.encodedColumnDelimiter
          ),
        decode: (str) =>
          replaceAll(
            str,
            this.grammar.encodedColumnDelimiter,
            this.grammar.columnDelimiter
          ),
      },
      {
        encode: (str) =>
          replaceAll(
            str,
            this.grammar.rowDelimiter,
            this.grammar.encodedRowDelimiter
          ),
        decode: (str) =>
          replaceAll(
            str,
            this.grammar.encodedRowDelimiter,
            this.grammar.rowDelimiter
          ),
      },
      {
        // Turn "%20" into "+" for prettier urls.
        encode: (str) => str.replace(/\%20/g, "+"),
        decode: (str) => str.replace(/\+/g, "%20"),
      },
    ]
    this.grammar = grammar
    if (typeof patchInput === "string") this.uriEncodedString = patchInput
    else if (Array.isArray(patchInput))
      this.uriEncodedString = this.arrayToEncodedString(patchInput)
    else this.uriEncodedString = this.objectToEncodedString(patchInput)
  }
  objectToEncodedString(obj) {
    return Object.keys(obj)
      .map((identifierCell) => {
        const value = obj[identifierCell]
        const valueCells = value instanceof Array ? value : [value]
        const row = [identifierCell, ...valueCells].map((cell) =>
          this.encodeCell(cell)
        )
        return row.join(this.grammar.columnDelimiter)
      })
      .join(this.grammar.rowDelimiter)
  }
  arrayToEncodedString(arr) {
    return arr
      .map((line) =>
        line
          .map((cell) => this.encodeCell(cell))
          .join(this.grammar.columnDelimiter)
      )
      .join(this.grammar.rowDelimiter)
  }
  get array() {
    return this.uriEncodedString
      .split(this.grammar.rowDelimiter)
      .map((line) =>
        line
          .split(this.grammar.columnDelimiter)
          .map((cell) => this.decodeCell(cell))
      )
  }
  get object() {
    const patchObj = {}
    if (!this.uriEncodedString) return patchObj
    this.array.forEach((cells) => {
      const identifierCell = cells.shift()
      patchObj[identifierCell] = cells.length > 1 ? cells : cells[0] // If a single value, collapse to a simple tuple. todo: sure about this design?
    })
    return patchObj
  }
  encodeCell(unencodedCell) {
    return this.encoders.reduce(
      (str, encoder) => encoder.encode(str),
      unencodedCell
    )
  }
  decodeCell(encodedCell) {
    return this.encoders
      .slice()
      .reverse()
      .reduce((str, encoder) => encoder.decode(str), encodedCell)
  }
}
const replaceAll = (str, search, replace) => str.split(search).join(replace)

module.exports = { DefaultPatchGrammar, Patch }
