# PerCollECT - [LidarLimbs](https://percollect.github.io/LidarLimbs/)
## Perception Sensor Collaborative Effect and Cause Tree (PerCollECT) - Lidar Tree

This tree facilitates the analysis of cause and effect chain in the signal processing of automotive lidar sensors. Visualization of the tree can be found under [https://percollect.github.io/LidarLimbs/](https://percollect.github.io/LidarLimbs/).

![PerCollECT_Tree](https://user-images.githubusercontent.com/27010086/119817980-ea759380-beee-11eb-8549-1ae85cc3d550.png)


## The PerCollECT Method

PerCollECT aims to collect and systematically order cause and effect chains of automotive environment perception sensors, like radar, lidar camera and ultrasonic. Because of the sheer complexity of the cause and effect relationships, this can only be compiled collaboratively by the whole community. To achieve a high approval rate  in the community and ensure a scientific style, every cause and effect chain is referenced to a scientific publication or a measurement showing the effect.

As an effect, we define the deviation from the originally existing information about the environment in the signal or data. Effects are marked as gray rectangles in the tree. For example, an error in the measured distance to an object resulting from limited range resolution would be an effect in the signal processing of the sensor. An effect can have multiple causes but also a cause can lead to multiple effects. Consequently, a cause-effect chain can induce a subsequent effect in the signal or data.
Every condition leading to a deviation in the information is defined as the cause for an effect.
A cause can be a property of the emission unit's hardware, like the physics of the antenna design of a radar, they can be located in the propagation path, like weather conditions, or in the signal processing, like the resolution of AD-conversion. We distinguish between system independent causes (marked in green) and system design parameters (marked in purple).

Each node in the tree, effect or cause, contains a name, a unique identifier, an assignment to a block of the functional decomposition of the signal processing of the sensor. Additionally, every line between two nodes describes a cause-effect relationship. These relationships are always referenced with a scientific publication in the child node.

## Contributing

PerCollECT is based on a [tree structure](https://en.wikipedia.org/wiki/Tree_(data_structure)). Each node is represented by an xml file. Relations between nodes (called links) are set by adding a parent-child relation.<br>
The following shows a simple example of relations between node _pp1_ (parent) and node _r1_, node _r2_ and node _r3_ (children):

`pp_1_node.xml` example
```xml
<?xml version="1.0" encoding="utf-8"?>
<basic_node> id="pp1"
             title="add node title here" 
             adBlock="add functional decomposition block here" 
             description="add node description here" 
             references="add node reference here"
             placementParentId="add parent placement id here">

    <!-- parent-child relations. Add link to child node xml-file here: -->
    <!-- add node r1 as child -->
    <xi:include href="./r_1_node.xml" ... />  
    <!-- add node r2 as child -->
    <xi:include href="./r_2_node.xml" ... />
    <!-- add node r3 as child -->
    <xi:include href="./r_3_node.xml" ... />

</basic_node>
```

`r_1_node.xml` example
``` xml
<?xml version="1.0" encoding="utf-8"?>
<basic_node> id="r1" 
             title="add node title here" 
             adBlock="add functional decomposition block here" 
             description="add node description here" 
             references="add node reference here"
             placementParentId="add parent placement id here">
 
    <!-- no child nodes here -->

</basic_node>
```

**XML schema (XSD)**

The xml files follow the xsd schema files defined in `data/schema`. <br>
Note: The parser does not validate against the xsd schema at the moment.

**Naming convention**
  * Node file: _first-letter-of-block_ _ _no_ _node.xml. Example: Reception block node 1 `r_1_node.xml`
  * Node id: Similar to file name. `r_1_node.xml` &#8594; `r1`

### How to extend the data structure

**Add a new node** 

  1. Go to folder `data/`
  2. Create a new xml file using the pattern located at `data/pattern/node_pattern.xml` (e.g. _new_1_node.xml_)
  3. Open the potential parent node xml file and link the new node following this schema: `<xi:include href="./new_1_node.xml" xmlns:xi="http://www.w3.org/2003/XInclude" />`

To realize multiple root nodes the tree has an invisible root node stored at `./data/root_node.xml`.
Note: After editing the data source you'll need to empty the session storage (e.g. by closing the active tab) to see the changes!

**Set node attributes**

 Required attributes:
  * `id="..."` Unique identifier. To keep it clear use one similar to the file name
  * `title="..."` Title shown in visualization
  * `adBlock="..."` Decomposition block. Make sure you either use an already existing block name or a new one. Do not leave the field blank. This might cause errors <br>
    Existing blocks:
    * Object identification
    * Feature identification
    * Detection identification
    * Pre-processing
    * Reception
    * Signal propagation
    * Emission
  * `description="..."` Node description. Shown in visualization (info box)
  * `references="..."` Node references. Shown in visualization (info box) <br>
     Use the following schema to add a new reference: `[parent_id1, url1, further information]` `[parent_id2, url2, further information]` ...
  * `placementParentId="..."` Placement id for visualization purpose. If a node has multiple parent nodes add the parent node id under which it should be visualized in tree. If node has only one parent, leave it blank. Make sure the inserted id exists. Also make sure this attribute is set correctly otherwise it might cause errors

 Additional attributes:
  * `designParameterCause="true"` True if node is a design parameter (colored purple). Set `true` or skip

 For examples see `data/`.

## Visualization

Visualization of the tree can be found under [https://percollect.github.io/GenericGrove/](https://percollect.github.io/GenericGrove/).
It is supported by the following Browser: Chrome, Edge, Firefox, Opera and Safari. 

### Visualization Source Code

<p align="center">
  <img src="https://github.com/PerCollECT/GenericGrove/blob/master/docs/PerCollECT_code_architecture.svg" width="800" textalign="center"/>
</p>



#### XML parser

`xmlParser.js` provides an interface to parse the above defined data structure. The interface only requires the full path to the root xml file split into data host, data dictionary and the file name:

``` javascript
 let dataHost = "https://raw.githubusercontent.com/..."
 let dataDict = "master/data/";
 let xmlRootFile = "root_node.xml";

 let parsedData = parseTree(dataHost, dataDict, xmlRootFile); // parseTree returns [XMLDocument, additionalTreePairs]
 if(!parsedData.length) throw new Error("Parsing error occurred"); // parsedData is empty array if some error occurred while parsing
```

`parseTree(dataHost, dataDict, xmlRootFile)` returns an array containing two elements: 
  1. [`XMLDocument`](https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument) holding the basic tree structure
  2. [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) holding additional node pairs (id pairs). Since `XMLDocument` objects cannot handle multiple parent connections the additional connections needs to be filtered while parsing and stored separately. The parser identifies a connection as additional connection if the connection target id is not equal to the node id defined in attribute `placementParentId`. If no `placementParentId` set and additional connections for this node (e.g. multiple parents) exists in data they will not be recognized!

#### Model

The parsed and prepared data is always stored in the [`SessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) of the browser tab! It is loaded once at the beginning! 

`model.js` manages the parsed data. The data set consists of two objects (`XMLDocument`: tree, `Array`: additionalTreePairs).

#### Controller

`index.html` basically operates as a controller. It manages parsing the data, initializing the model as well as rendering the matching content.

#### Content interface

`sidenav.js` provides an interface to fill the side bar navigation with links based on the parsed tree (`addSideNavLinks()`).

`content.js` provides an interface to handle the current page content (`showCurrentContent()`). Depending on which link is active the whole tree or a subtree will be shown. It also handles the dynamic info boxes as well as the tree table.

#### Tree visualization

The tree visualization is based on [d3 tree library](https://d3-wiki.readthedocs.io/zh_CN/master/Tree-Layout/). To enable multiple parents as well as multiple roots the implementation realized in `treePlot.js` differs from the standard implementation. 

To realize multiple parent connections additional links are added separately:
``` javascript
// ======== update additional links ========
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
...
```

To realize multiple root nodes the tree has an invisible root node stored at `./data/root_node.xml`.

### How to setup the development environment with VS Code

1. Install [VS Code](https://code.visualstudio.com/)
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) plugin
3. Start a server by using the **Go Live** button 
4. Open a browser and navigate to **localhost:_PORT_** 

Note: Once you work locally the code also uses the local data files.

### Possible source code extentions

**Frontend**
  * How to visualize large trees: One possible implementation is a zoomable and scaleble tree. Example: [D3.js Drag and Drop, Zoomable, Panning, Collapsible Tree with auto-sizing.](http://bl.ocks.org/robschmuecker/7880033)
  * How to manipulate data set from GUI: To delete, add or edit nodes a UI might be a good solution. Example: [d3js tree editor with node create, delete, and rename](https://bl.ocks.org/adamfeuer/042bfa0dde0059e2b288) (left click on node)<br>
Note: To be able to manipulate the data and keep the changes the data needs to be stored in a database.

**Backend**
  * How to switch to a database: The existing data needs to be transfered to a database. If a database exists the javascript webpage can fetch data from it. One possible implementation to fetch the data is using [Ajax](https://en.wikipedia.org/wiki/Ajax_%28programming%29) database. Example [ajax fetch from database](https://www.w3schools.com/xml/ajax_database.asp), [ajax-php database](https://www.w3schools.com/php/php_ajax_database.asp). To manipulate the data from javascript it probably needs a brigde between javascript and php. Php handles the server-side actions (e.g. database query), JS handles the client-side actions (e.g. UI). Example [php-ajax brige](https://www.w3schools.com/php/php_ajax_php.asp).

  * How to properly validate the data: Once the data set is getting larger a comprehensive validation might be needed. First the code should validate against the xsd schema defined at `data/schema`. After that it might be a good idea to also validate the node attribute values (especially `id`, `adBlock`, `references`, `placementParendId`). [GitHub Actions](https://github.com/features/actions) can also help to avoid a non running page.

### Troubleshooting

**I cannot see the changes made on the data set:** 

After editing the data source you'll need to empty the session storage (e.g. by closing the active tab) to see the changes.

**A connection (link) between two nodes is not shown:**

If a node has multiple parent nodes make sure the `placementParentId` is set properly. If `placementParentId` isn't set and multiple parent connections exists at least some of the connections will not be rendered.



## Credits

The PerCollECT method is based on the following [publication](https://tuprints.ulb.tu-darmstadt.de/18949/) which has to be cited if referring to PerCollECT:<br>
C. Linnhoff, P. Rosenberger, S. Schmidt, L. Elster, R. Stark, and H. Winner, *“Towards Serious Perception Sensor Simulation for Safety Validation of Automated Driving - A Collaborative Method to Specify Sensor Models,”* submitted to the 24th International Conference on Intelligent Transportation Systems (ITSC), Indianapolis, IN, USA, 2021

The work received initial funding from SET Level and VVM of the PEGASUS project family, promoted by the German Federal Ministry for Economic Affairs  and Energy based on a decision of the Deutsche Bundestag.

The visualization was implemented by @rebeccasc.