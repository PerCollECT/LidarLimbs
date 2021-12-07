// Script provides methods for content behavior

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
    .html(node.title)
    .appendTo(infoBox);

  let table = document.createElement("table");

  // show node information
  let attributesToShow = [
    "id",
    "decomBlock",
    "description",
    "number of parent nodes",
    "number of child nodes",
    "references"];

  attributesToShow.forEach(function (a) {
    let value = [];

    switch (a) {
      case "id":
        value.push([a.toUpperCase(), node.id.replaceAll("\\n", "<br><br>")]);
        break;
      case "decomBlock":
        value.push(["Decomposition Block", node.decomBlock.replaceAll("\\n", "<br><br>")]);
        break;
      case "number of parent nodes":
        //value.push([a, getNumberOfParents(node)]);
        break;
      case "number of child nodes":
        //value.push([a, getNumberOfChildren(node)]);
        break;
      case "references":
        value = prepareReferencesInfo(node.references);
        value.forEach(function (e) {
          let nodeName = getNodeById(e[0].replaceAll(/[\s]/g, "")).title;
          let link = `${getLinkPath()}#${nodeName.replace(/[^A-Z0-9]/ig, "_").toLowerCase()}`;
          let output = [];
          e[0] = `Reference for influence on <a title='${e[0].replaceAll(/[\s]/g, "")}' href='${link}'>${nodeName}</a>`;
          reference = `<a href='${e[3].replaceAll(/[\s]/g, "")}' target='_blank'>${e[1]+':'+e[2]}</a>`;
          if (e.length > 4) {
            e[1] = `${reference}, ${e[4]}`;
            e.splice(2, 3);
          } else {
            e[1] = reference;
            e.splice(2, 2);
          }
        });
        break;      
      default:
        value.push([a, node[a].replaceAll("\\n", "<br><br>")]);
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
  navLink(search);
}

/**
 * Adds autocomplete to search bar
 * @param {Object} input 
 * @returns 
 */
function addAutoComplete(input) {
  // TODO switch to jQuery

  let tree = JSON.parse(getDataFromSessionStorage(repoName + "Tree"));
  if (!tree) return;

  // collect all nodes names in tree
  let arr = [];
  tree.forEach(function (n) {
    if (!arr.includes(n.title)) {
      arr.push(n.title);
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

