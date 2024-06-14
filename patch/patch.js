class Patch {
  constructor(patchInput = "", rowDelimiter = "&", columnDelimiter = "=") {
    this.rowDelimiter = rowDelimiter
    this.columnDelimiter = columnDelimiter
    // The pipeline of encodings. Operations will be run in order for encoding (and reveresed for decoding).
    this.encoders = [
      {
        encode: (str) => encodeURIComponent(str),
        decode: (str) => decodeURIComponent(str),
      },
      {
        encode: (str) =>
          this.replaceAll(
            str,
            columnDelimiter,
            encodeURIComponent(columnDelimiter)
          ),
        decode: (str) =>
          this.replaceAll(
            str,
            encodeURIComponent(columnDelimiter),
            columnDelimiter
          ),
      },
      {
        encode: (str) =>
          this.replaceAll(str, rowDelimiter, encodeURIComponent(rowDelimiter)),
        decode: (str) =>
          this.replaceAll(str, encodeURIComponent(rowDelimiter), rowDelimiter),
      },
      {
        // Turn "%20" into "+" for prettier urls.
        encode: (str) => str.replace(/\%20/g, "+"),
        decode: (str) => str.replace(/\+/g, "%20"),
      },
    ]
    if (typeof patchInput === "string")
      this.uriEncodedString = patchInput.replace(/^\#/, "")
    else if (Array.isArray(patchInput))
      this.uriEncodedString = this.arrayToEncodedString(patchInput)
    else this.uriEncodedString = this.objectToEncodedString(patchInput)
  }
  replaceAll(str, search, replace) {
    return str.split(search).join(replace)
  }
  objectToEncodedString(obj) {
    return Object.keys(obj)
      .map((identifierCell) => {
        const value = obj[identifierCell]
        const valueCells = value instanceof Array ? value : [value]
        const row = [identifierCell, ...valueCells].map((cell) =>
          this.encodeCell(cell)
        )
        return row.join(this.columnDelimiter)
      })
      .join(this.rowDelimiter)
  }
  arrayToEncodedString(arr) {
    return arr
      .map((line) =>
        line.map((cell) => this.encodeCell(cell)).join(this.columnDelimiter)
      )
      .join(this.rowDelimiter)
  }
  get array() {
    return this.uriEncodedString
      .split(this.rowDelimiter)
      .map((line) =>
        line.split(this.columnDelimiter).map((cell) => this.decodeCell(cell))
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

if (typeof module !== "undefined") module.exports = { Patch }
