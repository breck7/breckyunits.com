#! /usr/local/bin/node --use_strict
const tap = require("tap")
const { Patch } = require("./patch.js")

const { rowDelimiter, columnDelimiter } = new Patch()
const encodedRowDelimiter = encodeURIComponent(rowDelimiter)
const encodedColumnDelimiter = encodeURIComponent(columnDelimiter)

const runTree = (testTree) =>
  Object.keys(testTree).forEach((key) => testTree[key](tap.same))

const testTree = {}

const encodeString = (str) =>
  str.replace(/\&/g, rowDelimiter).replace(/\=/g, columnDelimiter)

const tests = [
  {
    string: encodeString(`foo=bar`),
    object: { foo: "bar" },
    array: [["foo", "bar"]],
  },
  { string: "", object: {}, array: [[""]] },
  {
    string: encodeString(`Country+Name=United+States`),
    object: { "Country Name": "United States" },
    array: [["Country Name", "United States"]],
  },
  {
    string: encodeString(`countries=United+States=Germany&chart=Map`),
    object: {
      countries: ["United States", "Germany"],
      chart: "Map",
    },
    array: [
      ["countries", "United States", "Germany"],
      ["chart", "Map"],
    ],
  },
  {
    string: `group=HighIncome=Canada=Norway&group=MediumIncome=Spain=Greece`,
    array: [
      ["group", "HighIncome", "Canada", "Norway"],
      ["group", "MediumIncome", "Spain", "Greece"],
    ],
  },
  {
    string: `filters=&=time=lastMonth`,
    array: [
      [`filters`, ""],
      ["", `time`, `lastMonth`],
    ],
    object: {
      filters: "",
      "": [`time`, `lastMonth`],
    },
  },
  {
    string: `paragraph${columnDelimiter}${encodedRowDelimiter}${encodedColumnDelimiter}`,
    object: {
      paragraph: `${rowDelimiter}${columnDelimiter}`,
    },
    array: [["paragraph", `${rowDelimiter}${columnDelimiter}`]],
  },
]

testTree.basics = async (areEqual) => {
  areEqual(new Patch().object, {})
  tests.forEach((test) => {
    if (test.object) {
      areEqual(new Patch(test.object).uriEncodedString, test.string)
      areEqual(new Patch(test.object).array, test.array)
      areEqual(new Patch(test.string).object, test.object)
      areEqual(new Patch(test.array).object, test.object)
    }

    areEqual(new Patch(test.string).array, test.array)
    areEqual(new Patch(test.array).uriEncodedString, test.string)
  })
}

testTree.devilTestsCase = async (areEqual) => {
  const original = {
    title: "!*'();:@&=+$,/?#[]-_.~|\"\\",
  }
  areEqual(new Patch(new Patch(original).uriEncodedString).object, original)
}

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
