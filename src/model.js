// Skript holds and manages page data

/**
 * Gets an array of different decomBlock attribute in tree
 * @returns array with decomBlock attributes
 */
function getdecomBlocks() {
    let tree = JSON.parse(getDataFromSessionStorage(repoName + "Tree"));
    if (!tree) return;
    let blocks = [];
    tree.forEach(function (n) {
        if (!blocks.includes(n.decomBlock)) {
            blocks.push(n.decomBlock);
        }
    });
    return blocks;
}

/**
 * Get node by attribute title. If more than one object the first will be returned.
 * @param {String} nodeName value  with title nodeName
 * @returns null if data does not includes node, else node
 */
function getNodeByTitle(nodeName) {
    let tree = JSON.parse(getDataFromSessionStorage(repoName + "Tree"));
    if (!tree) return;

    let found;
    nodeName = nodeName.toLowerCase().replace(/[^A-Z0-9]/ig, "_");
    tree.forEach(function (elem) {
        let e = elem.title.toLowerCase().replace(/[^A-Z0-9]/ig, "_");
        if (e == nodeName) {
            found = elem;
            return;
        }
    });
    return found;
}

/**
 * Get node value with Id nodeId
 * @param {String} nodeName value with Id nodeId
 * @returns null if data does not includes node, else node
 */
function getNodeById(nodeId) {
    let tree = JSON.parse(getDataFromSessionStorage(repoName + "Tree"));
    if (!tree) return;

    let found;
    tree.forEach(function (elem) {
        if (elem.id == nodeId) {
            found = elem;
            return;
        }
    });
    return found;
}

/**
 * Gets number of parents. Also handles multi parent connections.
 * @param {Object} node 
 * @returns amount of parents
 */
function getNumberOfParents(node) {
    let additionalTreePairs = JSON.parse(getDataFromSessionStorage(repoName + "AdditionalTreePairs"));
    if (!additionalTreePairs) return;
    let num = 0;

    if (node.parentNode) {
        if (node.parentNode.id != undefined && node.parentNode.id != "root") ++num;

    }
    else if (node.parent) {
        if (node.parent.id != undefined && node.parent.id != "root") ++num;
    }

    additionalTreePairs.forEach(function (p) {
        if (p[0] == node.id) {
            ++num;
        }
    });
    return num;
}

/**
 * Gets number of children. Also handles multi parent connections.
 * @param {Object} node 
 * @returns amount of children
 */
function getNumberOfChildren(node) {
    let additionalTreePairs = JSON.parse(getDataFromSessionStorage(repoName + "AdditionalTreePairs"));
    if (!additionalTreePairs) return;

    let childIds = [];
    if (node.childNodes) {
        node.childNodes.forEach(function (n) {
            childIds.push(n.id);
        })
    }
    else if (node.children) {
        node.children.forEach(function (n) {
            childIds.push(n.id);
        })
    }

    additionalTreePairs.forEach(function (p) {
        if (p[1] == node.id && !childIds.includes(p[0])) {
            childIds.push(p[0])
        }
    });
    return childIds.length;
}

/**
 * Returns array with all children of node. Also handles multi parent connections.
 * @param {*} node to get children of
 * @returns array with children nodes
 */
function getAllChildren(node) {
    let additionalTreePairs = JSON.parse(getDataFromSessionStorage(repoName + "AdditionalTreePairs"));
    if (!additionalTreePairs) return;

    let childIds = [];
    if (node.childNodes) {
        node.childNodes.forEach(function (n) {
            childIds.push(n.id);
        })
    }
    else if (node.children) {
        node.children.forEach(function (n) {
            childIds.push(n.id);
        })
    }

    additionalTreePairs.forEach(function (p) {
        if (p[1] == node.id) {
            childIds.push(p[0])
        }
    });

    let childs = [];
    childIds.forEach(function (id) {
        childs.push(getNodeById(id))
    })

    return childs;
}