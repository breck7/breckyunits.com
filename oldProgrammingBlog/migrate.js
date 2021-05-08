// Imports a brecksblog php dump encoded to JSON to Scroll files.

const { jtree } = require("/Users/breck/jtree")
const posts = require("./data.json")

a = Object.keys(posts)
	.map((key) => {
		const node = posts[key]
		const title = node.Title
		const timestamp = new Date(parseInt(key) * 1000)
		const permalink = jtree.Utils.stringToPermalink(title)

		//date 2012-12-18
		const date = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`

		const data = `title ${title}
date ${date}
permalink ${permalink}

${node.Essay}`

		const tree = new jtree.TreeNode(`file ${permalink}.scroll`)
		tree.nodeAt(0).appendLineAndChildren("data", data)
		return tree.toString()
	})
	.join("\n")

console.log(a)
