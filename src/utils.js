// Script providing utils

// check brower support of used methods, polyfill if not exists
if (!HTMLCollection.prototype.forEach) {
    HTMLCollection.prototype.forEach = Array.prototype.forEach;
}
if (!Object.prototype.forEach) {
    Object.prototype.forEach = Array.prototype.forEach;
}

if (!HTMLCollection.prototype.indexOf) {
    HTMLCollection.prototype.indexOf = Array.prototype.indexOf;
}

/**
 * Method shows error view in load_info DOM object
 * @param {String} msg error message
 */
function showErrorMsg(msg) {
    console.error(msg);
    try{
        $("#load_info").html(msg);
    }catch(e){
        // do nothing
    }
}

/**
* Method shows warning view in load_info DOM object
* @param {String} msg warning message
*/
function showWarningMsg(msg) {
    console.warn(msg);
    try{
        $("#load_info").html(msg);
    }catch(e){
        // do nothing
    }
}

/**
 * Method transforms xml data into json
 * @param {XMLDocument} xml data to parse into json
 * @param {Boolean} mergeChildNodes true if child nodes of different types
 *  (e.g. <node>, <basic_node>, <example_node>) shall be collected in same 
 *  attribute of parent, else false
 * @returns xml data as json
 */
function xmlToJson(xml, mergeChildNodes) {
    var obj = {};

    if (xml.nodeType == Node.ELEMENT_NODE) {
        // attributes
        xml.attributes.forEach(function (attr) {
            obj[attr.nodeName] = attr.nodeValue;
        });
    }
    else if (xml.nodeType == Node.TEXT_NODE) {
        obj = xml.nodeValue;
    }

    // children
    xml.childNodes.forEach(function (child) {
        let nodeName;
        if (mergeChildNodes) {
            nodeName = "children";
        }
        else {
            nodeName = child.nodeName;
        }

        if (typeof (obj[nodeName]) == "undefined") {
            obj[nodeName] = [xmlToJson(child, mergeChildNodes)];
        }
        else {
            if (typeof (obj[nodeName].push) == "undefined") {
                var old = obj[nodeName];
                obj[nodeName] = [];
                obj[nodeName].push(old);
            }
            obj[nodeName].push(xmlToJson(child, mergeChildNodes));
        }
    });
    return obj;
}

/**
 * Transforms xml tree to json array
 * @returns data as array
 */
function xmlToJsonArray(treeData) {
    let data = xmlToJson(treeData, true);
    let dataString = JSON.stringify(data);
    dataString = dataString.replaceAll("\"title\"", "\"name\"");
    data = JSON.parse(dataString);
    return data;
}

let idIndex = 0;
/**
 * Get uniqe id number
 * @returns unique id (number)
 */
function getUniqueId() {
    return ++idIndex;
}

/**
 * Keeps data in session storage
 */
function keepDataInSessionStorage(name, object) {
    window.sessionStorage.setItem(name, object);
}

/**
 * Gets data from session storage
 * @return data from session storage
 */
function getDataFromSessionStorage(name) {
    return window.sessionStorage.getItem(name);
}

/**
 * Capitalizes the first letter of string
 * @param {String} string 
 * @returns manipulated string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Removes all additionalTreePairs in array
 * @param {Array} array to removes additionalTreePairs from
 * @returns manipulated array
 */
function toSetArray(array) {
    if (!(array instanceof Array)) {
        return;
    }
    return additionalTreePairs.filter((t = {}, a => !(t[a] = a in t)));
}

/**
 * Checks if XML document includes errors
 * @param {*} parsedDocument 
 * @returns true if error, else false
 */
function isParseError(parsedDocument) {
    // TODO this method throw xml error while checking for parser errors,
    // find a better way to check parser errors

    // parser and parsererrorNS could be cached on startup for efficiency
    let parser = new DOMParser();
    let errorneousParse = parser.parseFromString('<', 'text/xml');
    let parsererrorNS = errorneousParse.getElementsByTagName("parsererror")[0].namespaceURI;

    if (parsererrorNS === 'http://www.w3.org/1999/xhtml') {
        // In PhantomJS the parseerror element doesn't seem to have a special namespace, 
        // so we are just guessing here
        return parsedDocument.getElementsByTagName("parsererror").length > 0;
    }
    return parsedDocument.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0;
}