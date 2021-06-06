// Script provides methods for content behavior

/**
 * Show current content of tree and node
 * @returns if tree is empty
 */
function showCurrentContent() {
  let tree = $.parseXML(getDataFromSessionStorage(repoName + "Tree"));
  if (!tree || treeIsEmpty(tree)) return;
  if (!$("#load_info")) return;

  $("#tree_view").empty();

  try {
    let currentRoot = tree.children[0];
    let plotSucceed;
    if (window.location.href.split("#")[1]) {
      currentRoot = getNodeByTitle(window.location.href.split("#")[1]);
    }

    // plot current data
    prepareNodeAsRoot(currentRoot);
    plotSucceed = plotTree(xmlToJsonArray(currentRoot));

    if (plotSucceed) {
      $("#load_info").css("display", "none");
      window.addEventListener("resize", function (event) {
        resizeTreePlot();
      });
    }

    // add infos of current node
    if (window.location.href == homePath) return;
    $("#info_box").empty();
    addNodeInfos(currentRoot);

  } catch (error) {
    $("#load_info").css("display", "block");
    $("#load_info").html(`Could not load content ${window.location.hash}`);
    console.warn(error);
  }
}

/**
 * Prepares node to be new root. Makes sure all childs are connected.
 * @param {Object} currentRoot 
 */
function prepareNodeAsRoot(currentRoot) {
  let additionalTreePairs = JSON.parse(getDataFromSessionStorage(repoName + "AdditionalTreePairs"));
  if (!additionalTreePairs) return;

  // check if all referenced childs already included as child of root
  let descendants = Array.from(currentRoot.getElementsByTagName("*"));
  getAllChildren(currentRoot).forEach(function (c) {
    let includes = descendants.filter(function (d) {
      return d.id == c.id;
    });
    if (includes.length) return;
    currentRoot.appendChild(c);
  });

}

/**
 * Add info block of node
 * @param {Object} node 
 */
function addNodeInfos(node, id) {

  let infoBox = $("<div></div>")
    .addClass("info")
    .attr("id", function () { return id != undefined ? id : "" })
    .appendTo($("#info_box"));
  $('<div></div>')
    .addClass("infoHead")
    .html(node.getAttribute("title"))
    .appendTo(infoBox);

  let table = document.createElement("table");

  // show node information
  let attributesToShow = [
    "id",
    "adBlock",
    "description",
    "number of parent nodes",
    "number of child nodes",
    "references"];

  attributesToShow.forEach(function (a) {
    let value = [];

    switch (a) {
      case "id":
        value.push([a.toUpperCase(), node.attributes[a].value.replaceAll("\\n", "<br><br>")]);
        break;
      case "adBlock":
        value.push(["Block", node.attributes[a].value.replaceAll("\\n", "<br><br>")]);
        break;
      case "number of parent nodes":
        value.push([a, getNumberOfParents(node)]);
        break;
      case "number of child nodes":
        value.push([a, getNumberOfChildren(node)]);
        break;
      case "references":
        value = prepareReferencesInfo(node.attributes[a].value);
        value.forEach(function (e) {
          let nodeName = getNodeById(e[0].replaceAll(/[\s]/g, "")).getAttribute("title");
          let link = `${getLinkPath()}#${nodeName.replace(/[^A-Z0-9]/ig, "_").toLowerCase()}`;
          e[0] = `Reference for influence on <a title='${e[0].replaceAll(/[\s]/g, "")}' href='${link}'>${nodeName}</a>`;
          e[1] = `<a href='${e[1].replaceAll(/[\s]/g, "")}' target='_blank'>${e[1].replaceAll(/[\s]/g, "")}</a>`;
          if (e.length > 2) {
            e[1] = `${e[1]}, ${e[2]}`;
            e.splice(2, 1);
          }
        });
        break;      
      default:
        value.push([a, node.attributes[a].value.replaceAll("\\n", "<br><br>")]);
    }

    // caution: using jQuery to create table will cause an error
    // therefore DOM interface used
    value.forEach(function (e) {
      let tr = document.createElement("tr");
      let td1 = document.createElement("td");
      td1.setAttribute("id", "info_key");
      td1.innerHTML = capitalizeFirstLetter(e[0]);
      tr.appendChild(td1);
      let td2 = document.createElement("td");
      td2.innerHTML = e[1];
      tr.appendChild(td2);
      if (e.length > 2) {
        let td3 = document.createElement("td");
        td3.innerHTML = e[2];
        tr.appendChild(td3);
      }
      table.appendChild(tr)
    })
  });

  infoBox.append(table)
}

/**
 * Add legend to legend div
 */
function addLegend() {
  if ($("#tree_view").innerHTML == '') return;

  let colors = ["#f4f4f9", "#ace3b5", "#b4acd2"];
  let names = ["Effects", "System independent cause", "Design parameter"]
  for (let i = 0; i < colors.length; ++i) {
    $("<div></div>")
      .addClass("circle")
      .css("background", colors[i])
      .appendTo($("#legend"));
    $("<div></div>")
      .addClass("circle-text")
      .html(names[i])
      .appendTo($("#legend"));
  }
}

/**
 * Triggers search of tree
 */
function jumpToSearch() {
  let search = $("#search_input").val();
  if (!search) return;

  // prepare string
  search = search.trim().toLowerCase();
  search = search.replace(/\s{2,}/g, ' ');
  search = search.replace(/[^A-Z0-9]/ig, "_");
  window.location.hash = search;
}

/**
 * Adds autocomplete to search bar
 * @param {Object} input 
 * @returns 
 */
function addAutoComplete(input) {
  // TODO switch to jQuery

  let tree = $.parseXML(getDataFromSessionStorage(repoName + "Tree"));
  if (!tree) return;

  // collect all nodes names in tree
  let arr = [];
  tree.getElementsByTagName("*").forEach(function (n) {
    if (!arr.includes(n.getAttribute("title"))) {
      arr.push(n.getAttribute("title"));
    }
  })

  let currentFocus;
  input.addEventListener("input", function () {
    let val = this.value;

    // close already open lists
    closeAllLists();
    if (!val) {
      return false;
    }
    currentFocus = -1;

    // create element containing the complete items
    let divContainer = document.createElement("div");
    divContainer.setAttribute("id", `${this.id}autocomplete-list`);
    divContainer.setAttribute("class", "autocomplete-items");

    // append auto complete items
    this.parentNode.appendChild(divContainer);
    arr.forEach(function (e) {

      let includes = false;
      let parts = e.split(/[ ,]+/);

      parts.forEach(function (p) {
        if (p.toLowerCase().includes(val.toLowerCase())) {
          includes = true;
          return;
        }
      });

      if (includes) {
        let divEntry = document.createElement("div");
        let startIndex = e.toLowerCase().indexOf(val.toLowerCase());
        divEntry.innerHTML = e.substr(0, startIndex);
        divEntry.innerHTML += `<strong>${e.substr(startIndex, val.length)}</strong>`;
        divEntry.innerHTML += e.substr(startIndex + val.length, e.length);
        divEntry.innerHTML += `<input type='hidden' value='${e}'>`;
        divEntry.addEventListener("click", function () {
          input.value = this.getElementsByTagName("input")[0].value;
          closeAllLists();
        });
        divContainer.appendChild(divEntry);
      }
    });

  });

  // key pressed handler
  input.addEventListener("keydown", function (e) {
    let autoCompleteList = document.getElementById(`${this.id}autocomplete-list`);
    if (autoCompleteList) {
      autoCompleteList = autoCompleteList.getElementsByTagName("div");
    }
    if (e.keyCode == 40) {
      // if the down key is pressed
      currentFocus++;
      addActive(autoCompleteList);
    } else if (e.keyCode == 38) {
      // if the up key is pressed
      currentFocus--;
      addActive(autoCompleteList);
    } else if (e.keyCode == 13) {
      // if the enter key is pressed
      e.preventDefault();
      if (currentFocus > -1 && autoCompleteList) {
          autoCompleteList[currentFocus].click();
      }
      jumpToSearch();
    }
  });

  function addActive(autoCompleteList) {
    if (!autoCompleteList) return false;
    removeActive(autoCompleteList);
    if (currentFocus >= autoCompleteList.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (autoCompleteList.length - 1);
    autoCompleteList[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(autoCompleteList) {
    for (var i = 0; i < autoCompleteList.length; i++) {
      autoCompleteList[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(listElement) {
    var x = document.getElementsByClassName("autocomplete-items");
    x.forEach(function (e) {
      if (listElement != e && listElement != input) {
        e.parentNode.removeChild(e);
      }
    });

  }

  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

/**
 * Adds table to main content
 */
function addTreeTable() {
  let tree = $.parseXML(getDataFromSessionStorage(repoName + "Tree"));
  if (!tree) return;

  if (!$("#tree_table_collapse")) return;
  if (!$("#tree_table_content")) return;
  if (!$("#tree_table")) return;

  $("#tree_table_collapse").show();

  // header 
  let header = {
    id: "ID",
    effectName: "Effect name",
    block: "Block"
  };

  // data
  let data = [];
  tree.getElementsByTagName("*").forEach(function (n) {
    if(n.id == "root") return;
    let row = new Object();
    row.id = n.id;
    row.effectName = n.getAttribute("title");
    row.block = n.getAttribute("adBlock");
    data.push(row)
  });

  let table = $('#tree_table').tableSortable({
    data: data,
    columns: header,
    rowsPerPage: 10,
    pagination: true,
    searchField: "#searchField",
    onPaginationChange: function (nextPage, setPage) {
      setPage(nextPage);
    }
  });

  $('#changeRows').on('change', function () {
    table.updateRowsPerPage(parseInt($(this).val(), 10));
  });

  // add listener to toggle button
  $("#tree_table_content")
    .show()
    .height(
      $("#tree_table_menu").outerHeight(true) + $("#tree_table").outerHeight(true)
    )

  $("#tree_table_collapse").click(function () {
    if ($("#tree_table_collapse").hasClass("open")) {
      collapseTreeTable(400);
    }
    else {
      showTreeTable(200);
    }
  });
}

/**
 * Show tree table
 * @param {Number} delay transition delay
 */
function showTreeTable(delay) {
  if (!delay) delay = 0;

  $("#tree_table_content").css("overflow", "unset");

  $("#tree_table_collapse")
    .addClass("open")
    .attr("title", "Hide table");

  $("#toggle_symbol")
    .removeClass("fa-chevron-down")
    .addClass("fa-chevron-up");

  $("#tree_table_content")
    .css("transition", `height ${delay}ms`)
    .height(
      $("#tree_table_menu").outerHeight(true) + $("#tree_table").outerHeight(true)
    );

  setTimeout(() => {
    document.getElementById("tree_table_collapse").scrollIntoView({ behavior: 'smooth' });
  }, 0.8 * delay);
}

/**
 * Show tree table
 * @param {Number} delay transition delay
 */
function collapseTreeTable(delay) {
  if (!delay) delay = 0;

  $("#tree_table_content").css("overflow", "hidden");

  $("#tree_table_collapse")
    .removeClass("open")
    .attr("title", "Show table");

  $("#toggle_symbol")
    .removeClass("fa-chevron-up")
    .addClass("fa-chevron-down");

  $("#tree_table_content")
    .css("transition", `height ${delay}ms`)
    .height(0);
}


// helper methods

/**
 * Prepares value of attribute reference sof node for redering
 * @param {*} referenceString value of attribute references
 * @returns 
 */
function prepareReferencesInfo(referenceString){

  let preparedRefString = referenceString
  .replace("[", "")
  .replaceAll("]", "")
  //.replaceAll(/[\s]/g, "")
  .split("[")
  .filter(function (e) { return e != ""; });
  
  let value = [];
  for (item in preparedRefString) {
    value.push(preparedRefString[item].split(","));
  }

  return value;
}

