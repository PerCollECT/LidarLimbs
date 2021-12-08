![validate-json](https://github.com/PerCollECT/LidarLimbs/actions/workflows/validate-json.yml/badge.svg)

# PerCollECT - [LidarLimbs](https://percollect.github.io/LidarLimbs/)

## Perception Sensor Collaborative Effect and Cause Tree (PerCollECT) - Radar Tree

This tree facilitates the analysis of cause and effect chain in the signal processing of automotive lidar sensors. Visualization of the tree can be found under [https://percollect.github.io/LidarLimbs/](https://percollect.github.io/LidarLimbs/).

![PerCollECT_Tree](https://user-images.githubusercontent.com/27010086/119817980-ea759380-beee-11eb-8549-1ae85cc3d550.png)

## The PerCollECT Method

PerCollECT aims to collect and systematically order cause and effect chains of automotive environment perception sensors, like radar, lidar camera and ultrasonic. Because of the sheer complexity of the cause and effect relationships, this can only be compiled collaboratively by the whole community. To achieve a high approval rate  in the community and ensure a scientific style, every cause and effect chain is referenced to a scientific publication or a measurement showing the effect.

As an effect, we define the deviation from the originally existing information about the environment in the signal or data. Effects are marked as gray rectangles in the tree. For example, an error in the measured distance to an object resulting from limited range resolution would be an effect in the signal processing of the sensor. An effect can have multiple causes but also a cause can lead to multiple effects. Consequently, a cause-effect chain can induce a subsequent effect in the signal or data.
Every condition leading to a deviation in the information is defined as the cause for an effect.
A cause can be a property of the emission unit's hardware, like the physics of the antenna design of a radar, it can be located in the propagation path, like weather conditions, or in the signal processing, like the resolution of AD-conversion. We distinguish between system independent causes (marked in green) and system design parameters (marked in purple).

Each node in the tree, effect or cause, contains a name, a unique identifier, and an assignment to a block of the functional decomposition of the signal processing of the sensor. Additionally, every line between two nodes describes a cause-effect relationship. These relationships are always referenced with a scientific publication in the child node.

## Contributing

### Data structure
PerCollECT is based on a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph). All nodes is represented in the data.json file. Relations between nodes (called links) are set by adding the IDs of the parent nodes to the child node. In addition, the references for the links are set in the field "references"<br>
The following shows a simple example of relations between node _18_ (child) and node _19_ and node _20_ (parents):

`data.json` example
```json
{
    "id": "18",
    "parentIds": ["19","20"],
    "title": "Aliasing",
    "decomBlock": "Pre-processing",
    "description":"Aliasing effects in FFTs leading to ambiguous measurements",
    "references": "[19, Holder et al., Modeling and Simulation of Radar Sensor Artifacts for Virtual Testing of Autonomous Driving,https://mediatum.ub.tum.de/doc/1535151/1535151.pdf, Aliasing, p.2][20, Holder et al., Modeling and Simulation of Radar Sensor Artifacts for Virtual Testing of Autonomous Driving,https://mediatum.ub.tum.de/doc/1535151/1535151.pdf, Aliasing, p.2]",
    "nodeType": "designParameter"
}
```

A node always contains the following attributes:
* `id` of the nodes is a consecutive integer.
* `parentIds` list all parent nodes.
* `title` is a very short description of the effect or cause, that will be displayed directly in the visualization.
* `decomBlock` refers to the associated decomposition block Emission, Signal propagation, Reception, Pre-processing, Detection identification, Feature identification or Object identification.
* `description` contains a more detailed explanation of the effect or cause.
* `references` contains for every parent the first author, the title and the link to the literature item. Optionally a short note about the reference e.q. the page number of interest can be added.
* `nodeType` states, if the node is an effect, a designParameter or systemIndependent.

### Add a new node

  1. Create a new branch in the repository
  2. Open the `data.json` file
  3. Add a comma after the last node
  4. Add your new node with all the aforementiones attributes

Note: After editing the data source you'll need to empty the session storage (e.g. by closing the active tab) to see the changes!

## Visualization

Visualization of the tree can be found under [https://percollect.github.io/LidarLimbs/](https://percollect.github.io/LidarLimbs/).
It is supported by the following Browser: Chrome, Edge, Firefox, Opera and Safari. 

### Visualization Source Code

#### Content

`content.js` basically operates as a controller. It manages parsing the data, initializing the model as well as rendering the matching content.

#### Model

The parsed and prepared data is always stored in the [`SessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) of the browser tab! It is loaded once at the beginning! 

`model.js` manages the parsed data by providing getter functions for certain attributes.


#### Side navigation

`sidenav.js` provides an interface to fill the side bar navigation with links based on the parsed graph.


#### Graph visualization

The visualization is a directed acyclic graph based on [d3 DAG](https://github.com/erikbrinkman/d3-dag) with a Sugiyama base layout. It is controlled in `dag.js`

### How to setup the development environment with VS Code

1. Install [VS Code](https://code.visualstudio.com/)
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) plugin
3. Start a server by using the **Go Live** button 
4. Open a browser and navigate to **localhost:_PORT_** 

Note: Once you work locally the code also uses the local data files.

### Possible source code extentions

**Backend**
  * How to switch to a database: The existing data needs to be transfered to a database. If a database exists the javascript webpage can fetch data from it. One possible implementation to fetch the data is using [Ajax](https://en.wikipedia.org/wiki/Ajax_%28programming%29) database. Example [ajax fetch from database](https://www.w3schools.com/xml/ajax_database.asp), [ajax-php database](https://www.w3schools.com/php/php_ajax_database.asp). To manipulate the data from javascript it probably needs a brigde between javascript and php. Php handles the server-side actions (e.g. database query), JS handles the client-side actions (e.g. UI). Example [php-ajax brige](https://www.w3schools.com/php/php_ajax_php.asp).

  * How to properly validate the data: Once the data set is getting larger a comprehensive validation might be needed. First the code should validate against a json schema. After that it might be a good idea to also validate the node attribute values (especially `id`, `decomBlock`, `references`). [GitHub Actions](https://github.com/features/actions) can also help to avoid a non running page.

### Troubleshooting

**I cannot see the changes made on the data set:** 

After editing the data source you'll need to empty the session storage (e.g. by closing the active tab) to see the changes.

## Credits

The PerCollECT method is based on the following [publication](https://tuprints.ulb.tu-darmstadt.de/18949/) which has to be cited if referring to PerCollECT:<br>
C. Linnhoff, P. Rosenberger, S. Schmidt, L. Elster, R. Stark, and H. Winner, *“Towards Serious Perception Sensor Simulation for Safety Validation of Automated Driving - A Collaborative Method to Specify Sensor Models,”* submitted to the 24th International Conference on Intelligent Transportation Systems (ITSC), Indianapolis, IN, USA, 2021

A **video presentation** of the percollect method can be found [here](https://www.youtube.com/watch?v=21PGnUsmu9w&t=371s).  

The work received initial funding from SET Level and VVM of the PEGASUS project family, promoted by the German Federal Ministry for Economic Affairs and Energy based on a decision of the Deutsche Bundestag.
