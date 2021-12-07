let scale;
let svgSelection;
let defs;
let layout;
let dag;
let nodes;
let graph;
let width = 600, height = 400;
let maxTextLength = 200;
let nodeWidth = maxTextLength + 20;
let nodeHeight = 140;

// Define the zoom function for the zoomable tree
var zoom = d3.zoom()
      .scaleExtent([1, 10])
      .on('zoom', function(event) {
        graph
            .attr('transform', event.transform);
});

// How to draw edges
const line = d3
.line()
.curve(d3.curveCatmullRom)
.x((d) => d.x + nodeWidth/2)
.y((d) => d.y + nodeHeight/2);


function initGraph() {
    // fetch data and render
    data = JSON.parse(getDataFromSessionStorage(repoName + "Tree"));
    dag = d3.dagStratify()(data);
    layout = d3
      .sugiyama() // base layout
      .decross(d3.decrossTwoLayer().order(d3.twolayerAgg())) // minimize number of crossings
      .nodeSize((node) => [(node ? 3.6 : 0.25) * nodeWidth, 2 * nodeWidth]); // set node size instead of constraining to fit
    const { width, height } = layout(dag);
    
    // --------------------------------
    // This code only handles rendering
    // --------------------------------
    svgSelection = d3.select("svg");
    svgSelection.attr("viewBox", [0, 0, width, height].join(" "));
    svgSelection.call(zoom);
    graph = svgSelection.append("g");
    
    defs = graph.append("defs"); // For gradients 
    
    // Plot edges
    graph
      .append("g")
      .selectAll("path")
      .data(dag.links())
      .enter()
      .append("path")
      .attr("d", ({ points }) => line(points))
      .attr("fill", "none")
      .attr("stroke-width", 3)
      .style("stroke", "#222222");
  
    // Select nodes
    nodes = graph
      .append("g")
      .selectAll("g")
      .data(dag.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", ({ x, y }) => `translate(${x}, ${y})`);
  
    // Plot nodes
    nodes
      .append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("rx", function (d) {
        switch (d.data.nodeType) {
          case "designParameter":
            return 40;
          case "systemIndependent":
            return 40;
          default:
            return 2;
        }
      })
      .attr("stroke-width", 1.5)
      .style("fill", function (d) {
        switch (d.data.nodeType) {
          case "designParameter":
            return "#b4acd2";
          case "systemIndependent":
            return "#ace3b5";
          default:
            return "#f4f4f9";
        }
      })
      .on("click", onNodeClicked);
  
    // Add text to nodes
    nodes
      .append("text")
      .attr("y", nodeHeight / 2)
      .attr("x", 13)
      .attr("dy", ".35em")
      .text((d) => d.data.title)
      .call(wrapNodeText, maxTextLength)
      .on("click", onNodeClicked);
    
    // Add information icon
    nodes.append("circle")
      .attr("class", "iButton")
      .attr("cx", nodeWidth-20)
      .attr("cy", 20)
      .attr("r", 15)
      .on("mouseover", function () { d3.select(this).attr("r", 20); })
      .on("mouseout", function () { d3.select(this).attr("r", 15); })
      .on("click", onNodeInfoClicked);

    nodes.append("text")
      .attr("class", "iText")
      .attr("y", 26.5)
      .attr("x", nodeWidth - 20 - (5 / 2))
      .html("i");
  };

/**
 * Interface to parse all data starting at
 * @param {String} host of json file
 * @param {String} dataDict dictionary at domain where the data is located
 * @param {String} jsonRootFile file name of json file
 */
 function parseData(host, dataDict, jsonDataFile) {
  let jsonRootFullPath = (window.location.href.includes("localhost") || window.location.href.includes("127.0.")) ?
  `./${jsonDataFile}` : `${host}${dataDict}${jsonDataFile}`;

  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", jsonRootFullPath, false);
  var allText;
  rawFile.onreadystatechange = function ()
  {
      if(rawFile.readyState === 4)
      {
          if(rawFile.status === 200 || rawFile.status == 0)
          {
              allText = rawFile.responseText;
          }
      }
  }
  rawFile.send(null);
  data = JSON.parse(allText);

  return data;
 }


 /**
  * Performs action after the info label is clicked
  * @param {Object} d clicked info
  */
 function onNodeInfoClicked(d) {
    let currentNodeId = d.currentTarget.__data__.data.id;
    let node = getNodeByTitle(d.currentTarget.__data__.data.title);
    $("#info_box").empty();
    addNodeInfos(node, "preview");
    document.getElementById("preview").scrollIntoView({ behavior: 'smooth' });
    updateGraphPlot(currentNodeId);
 }

/**
 * Performs action after the a node is clicked
 * @param {Object} d clicked info
 */
 function onNodeClicked(d) {
  let currentNodeId = d.currentTarget.__data__.data.id;
  let node = getNodeByTitle(d.currentTarget.__data__.data.title);
  $("#info_box").empty();
  addNodeInfos(node, "preview");
  updateGraphPlot(currentNodeId);
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
      let words = textd3.text().split(" ").reverse();
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
          .attr('dy', dy );
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
  });
}

/**
 * Performs graph update. Updates nodes and links.
 * @param {Number} currentNodeId
 */
 function updateGraphPlot(currentNodeId) {
  graphs = graph.selectAll("path");
  paths = graphs._groups[0];
  paths.forEach(function (d) {
      source = d.__data__.source.data;
      target = d.__data__.target.data;
      if (currentNodeId == source.id) {
        d.setAttribute("stroke-width", "10");
        d.setAttribute("style", "stroke: rgb(255, 0, 0);");
      }
      else if (currentNodeId == target.id) {
        d.setAttribute("stroke-width", "10");
        d.setAttribute("style", "stroke: rgb(0, 0, 255);");
      }
      else {
        d.setAttribute("stroke-width", "1.5");
        d.setAttribute("style", "stroke: rgb(34, 34, 34);");
      }
  });
}