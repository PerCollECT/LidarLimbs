// Script provides xml data parsing

let data = document.implementation.createDocument("", "", null);
let additionalTreePairs = [];
let lastParent = null;
let recursionCounter;
let errorOccurred;

/**
 * Interface to parse all data starting at
 * @param {String} host of xml root file
 * @param {String} dataDict dictionary at domain where the data is located
 * @param {String} xmlRootFile file name of xml file defines three root
 */
function parseTree(host, dataDict, xmlRootFile) {
    let xmlRootFullPath = (window.location.href.includes("localhost") || window.location.href.includes("127.0.")) ?
        `./data/${xmlRootFile}` : `${host}${dataDict}${xmlRootFile}`;

    recursionCounter = 0;
    errorOccurred = false;
    
    loadTree(xmlRootFullPath);

    if (errorOccurred) {
        return [];
    }
    else {
        return [data, toSetArray(additionalTreePairs)];
    }
}

/**
 * Method runs http request
 *
 * @param {String} httpMethod request method
 * @param {String} url to request
 * @param {Function} callback called after request
 */
var createXhrRequest = function (httpMethod, url, callback) {
    var xhr;
    if (window.XMLHttpRequest) {
        // firefox, opera, IE7, and other use the native object
        xhr = new XMLHttpRequest();
    }
    else {
        // IE5/IE6 use ActiveX control
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xhr.open(httpMethod, url, false);

    xhr.onload = function () {
        if (xhr.readyState === xhr.DONE && xhr.status === 200) {
            callback(null, xhr.responseText);
        }
        else {
            callback(xhr.status, xhr.responseText);
        }
    };

    xhr.onerror = function () {
        callback(xhr.status, xhr.responseText);
    };

    xhr.send();
}

/**
 * Method loads tree recursively
 * @param {String} xmlFile local path to xml file
 */
function loadTree(xmlFile) {

    // TODO properly catch error or adjust counter if tree grows
    ++recursionCounter;
    if (recursionCounter > 1000) {
        showErrorMsg(`xmlParser.js: Too much recursion.<br> See console output for more information`);
        console.warn(`too much recursion in ${xmlFile} or parent`)
        errorOccurred = true;
        return;
    }

    createXhrRequest("GET", xmlFile, function (err, response) {
        if (err != null) {
            if (err == 404) {
                let networkLoadErrorMsg = "xmlParser.js: Error - Could not find file ";
                showErrorMsg(networkLoadErrorMsg.concat(xmlFile));
            }
            else {
                let networkErrorMsg = "xmlParser.js: Error - HTTP request failed with error code ";
                showErrorMsg(networkErrorMsg.concat(err));
            }
            errorOccurred = true;
            return;
        }

        // parse xml, use DOMParser to catch parser errors
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(response, "text/xml");
        if (isParseError(xmlDoc)) {
            if (xmlDoc.documentElement.childNodes[0].nodeValue) {
                showErrorMsg(`xmlParser.js: 
                        ${xmlDoc.documentElement.childNodes[0].nodeValue.replace(/</g, "&lt;")} 
                        ${xmlFile}`);
            }
            else {
                showErrorMsg(`xmlParser.js: File ${xmlFile} <br><br> 
                    ${xmlDoc.documentElement.children[0].innerHTML}`);
            }
            errorOccurred = true;
            return;
        }

        // the actual object of the file is the first child of file
        let docRoot = xmlDoc.childNodes[0];

        addNode(docRoot, lastParent);

        if (docRoot.hasChildNodes) {
            docRoot.childNodes.forEach(function (child) {
                if (child.nodeType == Node.TEXT_NODE) return;
                if (child.nodeType == Node.COMMENT_NODE) return;
                if (child.hasAttribute("href")) {
                    // node found, update parent and look for children
                    lastParent = docRoot;
                    let path = child.getAttribute("href");
                    loadTree(`./data/${path}`);
                }
            });
        }
    });
}

/**
 * Adds node to data set
 * @param {Object} node to add to data set
 * @param {Object} parent of node
 */
function addNode(node, parent) {
    // check if node contains placementParentId attribute
    if (!node.hasAttribute("placementParentId")) {
        showErrorMsg(`xmlParser.js: Error - Could not load ${node.nodeName}_${node.id}. 
            Missing attribute <b>placementParentId</b>.`);
        errorOccurred = true;
        return;
    }

    // filter additional/multiparent nodes:
    // if id of attribute placementParendId not equal id of parent, this is
    // an additional node. Keep it in additionalTreePairs to handle later as 
    // multiple parent object in tree plot.
    if (parent != null
        && node.getAttribute("placementParentId") != ""
        && node.getAttribute("placementParentId") != parent.id) {
        additionalTreePairs.push([node.id, parent.id]);
        return;
    }

    // ignore if already included in data
    if (includesNode(data, node)) return;

    // add node
    let nNode = data.createElement(node.nodeName);
    node.attributes.forEach(function (attr) {
        nNode.setAttribute(attr.nodeName, node.getAttribute(attr.nodeName));
    });

    if (parent == null) {
        data.appendChild(nNode);
    }
    else {
        data.getElementsByTagName("*").forEach(function (elem) {
            if (elem.getAttribute("id") == parent.getAttribute("id")) {
                elem.appendChild(nNode);
            }
        });
    }
}

/**
 * Checks if node already exists in dataset
 * @param {*} dataset with all nodes
 * @param {*} node to check
 * @returns true if included, else false
 */
function includesNode(dataset, node) {
    // caution: use basic iteration to avoid errors caused by
    // parallelization of prototype.forEach
    let d = dataset.getElementsByTagName("*");
    for (let i = 0; i < d.length; ++i) {
        let e = d[i];
        if (e.getAttribute("id") == node.getAttribute("id")) {
            return true;
        }
    }
    return false;
}