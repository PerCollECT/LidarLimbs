// Script providing interface for tree data handling and plots.
// The tree is rendered with using D3 collapse tree.
// The D3 tree documentation: https://d3-wiki.readthedocs.io/zh_CN/master/Tree-Layout/
// A simple example: https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd

// plot properties
let root;
let treePlot;
let diagonal;
let svg;
let duration = 750;
let treeMargin = { top: 0, right: 100, bottom: 50, left: 20 };
let treeWidth = window.innerWidth - treeMargin.right - treeMargin.left;
let treeHeight = window.innerHeight - treeMargin.top - treeMargin.bottom;
let maxTextLength = 90;
let nodeWidth = maxTextLength + 20;
let nodeHeight = 36;
let scale = 0.85;

// helper properties
let additionalLinks;
let adBlockInfos;

/**
* Interface to plot tree data
* @param {Array} treeData data to fill the tree with
* @return true if plot successful, else false
*/
function plotTree(treeData) {
    if (!initTree(treeData)) return false;
    updateTreePlot(root);
    resizeTreePlot();
    d3.select(self.frameElement).style("height", "500px");
    return true;
}

/**
 * Initializes tree properties
 * @param {Object} treeData data to fill the tree with
 * @returns true if successful, else false
 */
function initTree(treeData) {
    if (!(treeData instanceof Object)) {
        showWarningMsg("treePlot.js: Cannot read tree data");
        return false;
    }
    if (treeData.length == 0) {
        showWarningMsg("treePlot.js: Empty tree");
        return false;
    }

    // init tree
    treePlot = d3.layout.tree()
        .separation(function (a, b) { return 1; })
        .size([treeWidth, treeHeight]);
    diagonal = d3.svg.diagonal()
        .projection(function (d) { return [d.x + nodeWidth / 2, d.y + nodeHeight / 2]; });
    svg = d3.select("div#tree_view")
        .append("svg")
        .attr("width", treeWidth + treeMargin.right + treeMargin.left)
        .attr("height", treeHeight + treeMargin.top + treeMargin.bottom)
        .attr("transform", `translate(${treeMargin.left},${treeMargin.top})scale(${scale},${scale})`);
    root = treeData;
    root.x0 = treeHeight / 2;
    root.y0 = 0;

    // collect adBlock infos of nodes
    collectAdBlockDepthInfos(root);
    // collect additional links for nodes with multiple partens
    additionalLinks = collectAdditionalLinks();

    return true;
}

/**
 * Performs tree update. Updates nodes and links.
 * @param {Object} source
 */
function updateTreePlot(source) {
    let i = 0;
    let nodes = treePlot.nodes(root).reverse();
    let links = treePlot.links(nodes).filter(function (l) {
        return nodes.includes(l.source)
            && nodes.includes(l.target)
    });

    // ======== transform ========
    nodes.forEach(function (d) {
        prepareNodeDepth(d);
        d.y = d.depth * 80;
        if (d == root) d.y += 15;
    });

    // ======== update nodes and text elements ========
    let node = svg.selectAll("g.node")
        .data(nodes, function (d) { return d.id || (d.id = ++i); });

    let nodeEnter = node.enter().append("g")
        .attr("class", function(d){ return d.id == "root" ? "node-root" : "node";})
        .attr("transform", function (d) { return `translate(${source.x0},${source.y0})`; });

    nodeEnter.append("rect")
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", function (d) {
            return (getNumberOfChildren(d) > 0) ? 2 : 20;
        })
        .attr("stroke-width", 1.5)
        .style("fill", function (d) {
            if (d.designParameterCause) return "#b4acd2";
            return (getNumberOfChildren(d) > 0) ? "#f4f4f9" : "#ace3b5";
        })
        .on("click", onTreeNodeClicked);

    nodeEnter.append("text")
        .attr("y", nodeHeight / 2)
        .attr("x", 13)
        .attr("dy", ".35em")
        .text(function (d) { return d.name; })
        .call(wrapNodeText, maxTextLength)
        .style("fill-opacity", 1e-6)
        .on("click", onTreeNodeClicked);

    nodeEnter.append("circle")
        .attr("class", "iButton")
        .attr("cx", nodeWidth)
        .attr("r", 10)
        .on("mouseover", function () { d3.select(this).attr("r", 15); })
        .on("mouseout", function () { d3.select(this).attr("r", 10); })
        .on("click", onTreeInfoClicked);

    nodeEnter.append("text")
        .attr("class", "iText")
        .attr("y", 6.5)
        .attr("x", nodeWidth - (5 / 2))
        .html("i");

    let nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) { return `translate(${d.x},${d.y})`; });

    nodeUpdate.select("rect")
        .attr("width", nodeWidth)
        .attr("stroke-width", 1.5);

    nodeUpdate.select("text").style("fill-opacity", 1);

    let nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) { return `translate(${source.x},${source.y})`; })
        .remove();

    nodeExit.select("rect")
        .attr("width", nodeWidth)
        .attr("height", nodeHeight);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);


    // ======== update links ========
    let link = svg.selectAll("path.link")
        .data(links, function (d) { return d.target.id; });

    link.enter().insert("path", "g")
        .attr("class", function(d){ return d.source.id == "root" ? "link-root" : "link"; })
        .attr("x", nodeWidth / 2)
        .attr("y", nodeHeight / 2)
        .attr("d", function (d) {
            var o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o });
        });

    link.transition()
        .duration(duration)
        .attr("d", diagonal)
        .attr("stroke-width", function (d) {
            if (currentInfoboxNode == null) return;
            return (d.source == currentInfoboxNode
                || d.target == currentInfoboxNode) ? 2.7 : 2.0;
        })
        .style("stroke", function (d) {
            if (currentInfoboxNode == null) return;
            if (d.source == currentInfoboxNode) return "#f23d3d";
            if (d.target == currentInfoboxNode) return "#2185ff";
            return "#A9A9A9"
        });

    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            let o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
        })
        .remove();


    // ======== update additional links ========
    // WORKAROUND: add additional links defined in  
    // additionalLinks so that childs can have multiple parents
    let mpLink = svg.selectAll("path.mpLink")
        .data(additionalLinks);

    mpLink.enter().insert("path", "g")
        .attr("class", "mpLink")
        .attr("x", nodeWidth / 2)
        .attr("y", nodeHeight / 2)
        .attr("d", function (d) {
            var o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o });
        });

    mpLink.transition()
        .duration(duration)
        .attr("d", diagonal)
        .attr("stroke-width", function (d) {
            if (currentInfoboxNode == null) return;
            return (d.source == currentInfoboxNode
                || d.target == currentInfoboxNode) ? 2.7 : 2.0;
        })
        .style("stroke", function (d) {
            if (currentInfoboxNode == null) return;
            if (d.source == currentInfoboxNode) return "#f23d3d";
            if (d.target == currentInfoboxNode) return "#2185ff";
            return "#A9A9A9"
        });

    mpLink.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            let o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
        })
        .remove();

    // ======== transform ========
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

let currentInfoboxNode = null;
/**
 * Performs action after the info label is clicked
 * @param {Object} d clicked info
 */
function onTreeInfoClicked(d) {
    currentInfoboxNode = d;
    let node = getNodeByTitle(d.name);
    $("#info_box").empty();
    addNodeInfos(node, "preview");
    document.getElementById("preview").scrollIntoView({ behavior: 'smooth' });
    d3.event.stopPropagation();
    collapseTreeTable();
    updateTreePlot(d);
}

/**
 * Performs action after the a node is clicked
 * @param {Object} d clicked info
 */
 function onTreeNodeClicked(d) {
    currentInfoboxNode = d;
    let node = getNodeByTitle(d.name);
    $("#info_box").empty();
    addNodeInfos(node, "preview");
    d3.event.stopPropagation();
    collapseTreeTable();
    updateTreePlot(d);
}

/**
 * Updates the tree dimension
 */
function updateTreeDimension() {
    treePlot.size([treeWidth, treeHeight]);
    svg.attr("width", treeWidth + treeMargin.right + treeMargin.left)
        .attr("height", treeHeight + treeMargin.top + treeMargin.bottom)
        .attr("transform", `translate(${treeMargin.left},${treeMargin.top})scale(${scale},${scale})`);
}

/**
 * Resizes the tree using current window dimension
 */
function resizeTreePlot() {
    treeWidth = 0.9 * window.innerWidth - treeMargin.right - treeMargin.left;
    treeHeight = (getTreeDepth() + 2) * nodeHeight * 2;
    updateTreeDimension();
    updateTreePlot(root);
}


// helper methods


/**
 * Collects additional links from data set.
 * An additional link between two nodes is defined by the attribute
 * coupling_id which hold both nodes.
 */
function collectAdditionalLinks() {
    let allCouplingIds = [];
    let allCouplingElements = treePlot.nodes(root).filter(function (n) {
        let id = n['coupling_id'];
        if (id == undefined) return;
        id = id.split(",");
        id.forEach(function (idElement) {
            if (!allCouplingIds.includes(idElement)) {
                allCouplingIds.push(idElement);
            }
        });
        return n;
    });

    // TODO Filter already existing connections

    let couplingPairs = [];
    allCouplingIds.forEach(function (id) {
        let idPair = allCouplingElements.filter(function (n) {
            return n['coupling_id'].split(",").includes(id);
        });

        if (idPair[0] == undefined || idPair[1] == undefined) return;
        if (idPair[0].children && idPair[0].children.includes(idPair[1])) return;
        if (idPair[1].children && idPair[1].children.includes(idPair[0])) return;

        let objPair = new Object();

        if (idPair[0].depth > idPair[1].depth) {
            objPair.source = idPair[1];
            objPair.target = idPair[0];
        }
        else {
            objPair.source = idPair[0];
            objPair.target = idPair[1];
        }
        objPair._source = objPair.source;
        objPair._target = objPair.target;
        couplingPairs.push(objPair)
    });

    return couplingPairs;
}

/**
 * Collects information of associated decomposition (AD) block depth.
 * Keeps start and end depth of block in object.
 * Returns an object with information for each block in tree data.
 * Note: AD block information must be stored in node attribute "adBlock"
 * @return object with depth infos for each AD block in tree data
 */
function collectAdBlockDepthInfos(treeData) {
    if (!adBlockInfos) adBlockInfos = [];
    if (!treeData.hasOwnProperty("depth")) {
        treePlot.nodes(treeData).reverse(); // call adds depth attribute to nodes
    }

    let includes = false;
    adBlockInfos.forEach(function (d) {
        if (treeData.adBlock == d.name) {
            if (treeData.depth < d.start) {
                d.start = treeData.depth;
            }
            else if (treeData.depth > d.end) {
                d.end = treeData.depth;
            }
            includes = true;
            return;
        }
    });

    if (!includes) {
        let newDepth = new Object();
        newDepth.name = treeData.adBlock;
        newDepth.start = treeData.depth;
        newDepth.end = treeData.depth;
        adBlockInfos.push(newDepth);
    }

    if (treeData.children) {
        treeData.children.forEach(function (child) {
            collectAdBlockDepthInfos(child);
        });
    }

    adBlockInfos.sort((a, b) => (a.start > b.start) ? 1 : -1)
    return adBlockInfos;
}

/**
* Sets depth attrbite of node. Makes sure each AdBlock starts
* at a new depth. AdBlock of node is stored in attrubte adBlock.
* @param {*} node 
*/
function prepareNodeDepth(node) {
    // TODO for now only set depth of last block. Handle all blocks.
    if (node.adBlock != adBlockInfos[adBlockInfos.length - 1].name) return;

    if (!node.parent || node.parent == root) return;

    let parentDepthBlock = adBlockInfos.filter(function (d) {
        return d.name == node.parent.adBlock;
    });

    let nodeDepthBlock = adBlockInfos.filter(function (d) {
        return d.name == node.adBlock;
    });

    if (parentDepthBlock[0] == nodeDepthBlock[0]) return;

    if (parentDepthBlock[0].end >= nodeDepthBlock[0].start) {
        node.depth += 1;
    }
}

/**
 * Get depth of tree
 * @returns depth of tree
 */
function getTreeDepth() {
    let depth = 0;
    treePlot.nodes(root).forEach(function (n) {
        if (n.depth > depth) {
            depth = n.depth
        }
    });
    return depth;
}

/**
 * Method wraps long labels of nodes into multiple line label
 * @param {String} text labels
 * @param {Number} width max width of one line
 */
function wrapNodeText(text, width) {
    text.each(function (d) {
        let textd3 = d3.select(this);
        if (textd3.node().getComputedTextLength() < width) return;
        let words = textd3.text().split(new RegExp(/(?<=[.\-_\s+])/)).reverse();
        // split into lines
        let word;
        let line = [];
        let lineNumber = 0;
        let lineHeight = 1; // ems
        let x = textd3.attr('x');
        let y = textd3.attr('y');
        let dy = 0;
        let tspan = textd3.text(null)
            .append('tspan')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', dy + 'em');
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(' '));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(' '));
                line = [word];
                tspan = textd3.append('tspan')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                    .text(word);
            }
        }
        // set new box height
        let factor = 19 - lineNumber;
        d3.select(this.parentNode.childNodes[0]).attr("height", factor * (lineNumber + 1));
    });
}