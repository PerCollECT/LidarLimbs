// Skript holds and manages page data

/**
 * Initializes the tree data
 * @param {Object} data array with first element XMLDocument of tree 
 *  and second element additional tree pairs of XMLDocument (additional links).
 */
function initTreeModel(data) {
    if (!data.length) {
        showErrorMsg("model.js: Could not load tree data."
            + "<br> Check for too much recursion or empty data set")
        return;
    }
    prepareTreeData(data[0], data[1]);
}

/**
 * Prepares tree data for additional (multi parent) connections
 * @param {Object} node to add to data set
 * @param {Object} parent of node
 */
function prepareTreeData(tree, additionalTreePairs) {
    if (!additionalTreePairs || !additionalTreePairs.length || !tree) return;

    // for each pair in additionalTreePairs connect them by attribute coupling_id
    // to be able to render the connection later on
    additionalTreePairs.forEach(function (d) {
        connectMultiParentNode(tree.getElementsByTagName("*"), d[0], d[1]);
    })
    return;
}

/**
 * Adds additional parent to node by connecting them via 
 * attribute coupling_id
 * @param {*} allNodes of data set
 * @param {Object} node to add a additional parent to
 * @param {Object} parent of the node
 */
function connectMultiParentNode(allNodes, node, parent) {
    let couplingId = getUniqueId();
    let counter = 0;
    allNodes.forEach(function (n) {
        if (n.getAttribute("id") == node || n.getAttribute("id") == parent) {
            if (n.hasAttribute("coupling_id")) {
                let coupling = n.getAttribute("coupling_id");
                let alreadyIncluded = coupling.split(",").includes(couplingId);
                if (!alreadyIncluded) {
                    n.setAttribute("coupling_id", [coupling, couplingId]);
                    ++counter;
                }
            }
            else {
                n.setAttribute("coupling_id", couplingId);
                ++counter;
            }
        }
    });

    if (counter != 2) {
        showWarningMsg("model.js: Coupling elements failed")
    }
}

/**
 * Gets an array of different adBlock attribute in tree
 * @returns array with adBlock attributes
 */
function getAdBlocks() {
    let tree = $.parseXML(getDataFromSessionStorage(repoName + "Tree"));
    if (!tree) return;
    let blocks = [];
    tree.getElementsByTagName("*").forEach(function (n) {
        if (!blocks.includes(n.getAttribute("adBlock"))) {
            blocks.push(n.getAttribute("adBlock"));
        }
    });
    return blocks;
}

/**
 * Checks if tree is empty or not
 * @returns true if not empty, else false
 */
function treeIsEmpty(tree) {
    if (!tree) return false;
    if (!tree.childNodes[0] || !tree.childNodes[0].hasChildNodes()) {
        return true;
    }
    return false;
}

/**
 * Get node by attribute title. If more than one object the first will be returned.
 * @param {String} nodeName value  with title nodeName
 * @returns null if data does not includes node, else node
 */
function getNodeByTitle(nodeName) {
    let tree = $.parseXML(getDataFromSessionStorage(repoName + "Tree"));
    if (!tree) return;

    let found;
    nodeName = nodeName.toLowerCase().replace(/[^A-Z0-9]/ig, "_");
    tree.getElementsByTagName("*").forEach(function (elem) {
        let e = elem.getAttribute("title").toLowerCase().replace(/[^A-Z0-9]/ig, "_");
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
    let tree = $.parseXML(getDataFromSessionStorage(repoName + "Tree"));
    if (!tree) return;

    let found;
    tree.getElementsByTagName("*").forEach(function (elem) {
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