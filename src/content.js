if (isIE()) {
    $("#side_nav").empty();
    let infoText =
      "<h1 style='color:#2f4550;'>PerCollECT</h1>" +
      "<p style='color:#2f4550;'>does not support Internet Explorer</p>" +
      "<p style='color:#586f7c; font-family: monospace;'>Supported: Mozilla Firefox, Chrome, Edge, Opera, Safari, ...</p>"
    $("#load_info").html(infoText)

    throw new Error("index.js: No IE support");
  }

  // parse data only if tree not loaded already
  if (getDataFromSessionStorage(repoName + "Tree") === null) {
    let parsedData = parseData(dataHost, dataDict, jsonDataFile);
    if(!parsedData.length) throw new Error("index.js: Data error");
    keepDataInSessionStorage(repoName + "Tree", JSON.stringify(parsedData));
  }

  initGraph();

  // get decomBlock data if not already exists
  if (getDataFromSessionStorage(repoName + "decomBlocks") === null) {
    let decomBlocks = getdecomBlocks();
    keepDataInSessionStorage(repoName + "decomBlocks", JSON.stringify(decomBlocks));
  }

  // handle active links of side bar
  if (getDataFromSessionStorage(repoName + "ActiveLinks") === null || window.location.href == homePath) {
    keepDataInSessionStorage(repoName + "ActiveLinks", JSON.stringify([]));
  }

  // manage page content
  addLegend();
  addSideNavLinks();
  addAutoComplete(document.getElementById("search_input"));