const fs = require("fs");
const { TreeNode } = require("jtree/products/TreeNode.js");
const { Disk } = require("jtree/products/Disk.node.js");

const input =
  "/Users/breck/breckster/ketones/ketones/chemicalBloodTests.scroll";
const output = "/Users/breck/breckster/ketones/ketones/chemicalBloodTests.csv";

const content = Disk.read(input);
const conceptDelimiter = ":::";

const sections = content.split(conceptDelimiter);

const parseSchema = (tree) => tree.toObject();

let schema = {};
const concepts = sections
  .map((section) => {
    const tree = new TreeNode(section.trim()); // todo: remove blank links
    if (tree.has("schema")) {
      schema = parseSchema(tree.getNode("schema"));
      return null;
    }
    if (!tree.has("id:")) return null;
    // filter out anything not in schema

    tree.forEach((node) => {
      if (!schema[node.getWord(0)]) node.destroy();
    });

    return tree;
  })
  .filter((i) => i);

const rows = new TreeNode(concepts);

const csv = rows.asCsv;
const lines = csv.split("\n");
lines[0] = lines[0].replace(/:/g, ""); // remove :
Disk.write(output, lines.join("\n"));
