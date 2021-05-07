// Imports a brecksblog php dump encoded to JSON to Scroll files.

a = tree
	.map((node) => {
		const title = node.get("Title");
		const timestamp = new Date(parseInt(node.getWord(0)) * 1000);
		const permalink = jtree.Utils.stringToPermalink(title);
		console.log(timestamp);

		//date 2012-12-18
		const date = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`;

		const data = `title ${title}
date ${date}
permalink ${permalink}

${node.getNode("Essay").childrenToString()}`;

		const tree = new TreeNode(`file ${permalink}.scroll`);
		tree.nodeAt(0).appendLineAndChildren("data", data);
		return tree.toString();
	})
	.join("\n");
