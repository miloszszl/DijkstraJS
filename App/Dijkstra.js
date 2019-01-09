var nodeID = 0;
var edgeID = 0;
var editModeActive = true;
var editAction = null;
var edgeSize = 2;
var nodeSize = 16;
var notVisitedNodeColor = '#337ab7';
var firstNodeColor = "#8801a0";
var lastNodeColor = "#ce3b12";
var isPathEdited = false;
var colorMixed = "#bf005a";

document.getElementById('snapshotButton').onclick = function () {
    var imageName = $("#imageName").val();
    if (imageName == "")
        imageName = "graph";
    $("#imageName").val("");
    s.renderers[0].snapshot({ filename: imageName + '.png', format: 'png', background: 'white', labels: true, download: true })
}

function generateRandomIntegerNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomNode(nodes) {
    return nodes[generateRandomIntegerNumber(0, nodes.length - 1)];
}

// Instantiate sigma:
s = new sigma({
    graph: generateGraph(15, 25, 10, 50),
    container: 'graph-container',
    renderer: {
        container: document.getElementById('graph-container'),
        type: 'canvas'
    },
    settings: {
        defaultEdgeLabelSize: 16,
        edgeLabelSize: 'proportional',//'proportional'
        minNodeSize: nodeSize,
        maxNodeSize: nodeSize,
        minEdgeSize: edgeSize,
        maxEdgeSize: edgeSize,
        borderSize: 2,
        doubleClickEnabled: false,
        enableEdgeHovering: true,
        edgeHoverColor: 'edge',
        defaultEdgeHoverColor: '#333',
        edgeHoverExtremities: true,
        edgeHoverSizeRatio: 1.5,
        sideMargin: 12,
        edgeHoverExtremities: true,
        autoRescale: false, //true
        zoomMin: 0.5,
        zoomMax: 1.8
    }
});

function runNoverlap() {
    s.configNoverlap({
        nodeMargin: 0.1,
        scaleNodes: 5,
        gridSize: 50,
        speed: 2,
        easing: 'quadraticInOut', // animation transition function
        duration: 0
    });
    s.startNoverlap();
}

runNoverlap();

function generateNode(x, y) {

    if (x == undefined && y == undefined) {
        x = -$(window).width() / 2;
        y = -$(window).height() / 2;
    }

    return {
        id: 'n' + nodeID,
        label: 'Node ' + nodeID++,
        x: x,
        y: y,
        size: nodeSize,
        color: '#337ab7'
    }
}

function generateEdge(node1ID, node2ID, minWeight, maxWeight) {
    return {
        id: 'e' + edgeID++,
        label: generateRandomIntegerNumber(minWeight, maxWeight) + "",
        source: node1ID,
        target: node2ID,
        size: edgeSize,
        color: '#ccc',
        hover_color: '#333',
        type: 'curve'
    }
}

sigma.plugins.dragNodes(s, s.renderers[0]);
var dom = document.querySelector('#graph-container canvas:last-child');

function generateNodes(nodesNumber, camera = false) {
    var nodes = [];
    var endIndex = nodeID + nodesNumber;
    while (nodeID < endIndex) {
        if (camera == true && s != undefined) {
            nodes.push(generateNode(s.camera.x + generateRandomIntegerNumber(-$(window).width() / 4.2, $(window).width() / 4.2),
                s.camera.y + generateRandomIntegerNumber(-$(window).height() / 3.8, $(window).height() / 3.8)));
        }
        else
            nodes.push(generateNode());
    }
    return nodes;
}

function isSameEdgeBetweenNodes(node1ID, node2ID, edges) {
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        if ((edge.source == node1ID && edge.target == node2ID) || (edge.source == node2ID && edge.target == node1ID)) {
            return true;
        }
    }
    return false;
}

function generateEdges(edgesNumber, minWeight, maxWeight, nodes, sameNodeCycles = false) {
    var edges = [];
    var edgesByEquation

    if (sameNodeCycles) {
        edgesByEquation = edgeID + nodes.length * (nodes.length - 3) / 2 + nodes.length * 2;
    } else {
        edgesByEquation = edgeID + nodes.length * (nodes.length - 3) / 2 + nodes.length;
    }
    var edgesByUser = edgeID + edgesNumber;
    var endIndex = (edgesByUser > edgesByEquation) ? edgesByEquation : edgesByUser;
    var node1ID, node2ID;
    var maxIter = 50;
    var iter = 0;
    while (edgeID < endIndex) {
        do {
            iter++;
            node1ID = getRandomNode(nodes).id;
            node2ID = getRandomNode(nodes).id;
        }
        while (isSameEdgeBetweenNodes(node1ID, node2ID, edges) || iter < maxIter);
        if (sameNodeCycles || (!sameNodeCycles && (node1ID != node2ID))) {
            edges.push(generateEdge(node1ID, node2ID, minWeight, maxWeight));
        }
        iter = 0;
    }
    return edges;
}

function generateGraph(nodesNumber, edgesNumber, minEdgeWeight, maxEdgeWeight) {
    var g = {
        nodes: [],
        edges: []
    };
    g.nodes = generateNodes(nodesNumber);
    g.edges = generateEdges(edgesNumber, minEdgeWeight, maxEdgeWeight, g.nodes);
    return g;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function renderNewGraph(nodesNumber, edgesNumber, minEdgeWeight, maxEdgeWeight, sameNodeCycles) {
    s.graph.clear();
    var nodes = generateNodes(nodesNumber, true);
    var edges = generateEdges(edgesNumber, minEdgeWeight, maxEdgeWeight, nodes, sameNodeCycles);

    nodes.forEach(function (node) {
        s.graph.addNode(node);
    });

    edges.forEach(function (edge) {
        s.graph.addEdge(edge);
    });
    s.refresh();
}

function addNodeAtMousePosition(e) {
    var x, y;

    c = e.data.renderer.camera
    x = c.x + e.data.captor.x * c.ratio;
    y = c.y + e.data.captor.y * c.ratio;

    s.graph.addNode(generateNode(x, y));
    s.refresh();
}

dom.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

s.bind('rightClickStage', function (e) {
    if (editAction == "addNode") {
        addNodeAtMousePosition(e);
    }
});

var node1IDGlobal = null;
var node2IDGlobal = null;

function setNodeActive(nodeID) {
    if (nodeID != null) {
        var node = s.graph.nodes(nodeID);
        if (node != undefined) {
            node.color = "#74f23a";
        }
    }
}

function setNodeInactive(nodeID) {
    if (nodeID != null) {
        var node = s.graph.nodes(nodeID);
        if (node != undefined) {
            node.color = "#337ab7";
        }
    }
}

function addEdge(node1ID, node2ID, minWeight = 1, maxWeight = 10) {
    if (!isSameEdgeBetweenNodes(node1ID, node2ID, s.graph.edges())) {
        s.graph.addEdge(generateEdge(node1ID, node2ID, minWeight, maxWeight));
    }
}

function removeEdge(edgeID) {
    s.graph.dropEdge(edgeID);
    s.refresh();
}

function editEdge(edgeID, value) {
    if (edgeID != null && value != null) {
        s.graph.edges(edgeID).label = value;
        s.refresh();
    }
}

function editNode(nodeID, value) {
    if (nodeID != null && value != null) {
        s.graph.nodes(nodeID).label = value;
        s.refresh();
    }
}

function isNameUnique(nodeID, name) {
    var nodes = s.graph.nodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if ((node.id == nodeID) && (node.label == name)) {
            return false
        }
    }
    return true;
}

var nodeIDEdit = null;
s.bind('rightClickNode', function (e) {
    if (editAction == "removeNode") {
        if (firstNodeID != null && firstNodeID == e.data.node.id) {
            document.getElementById('first-node-btn').innerHTML = "First";
            firstNodeID = null;
        } else if (lastNodeID != null && lastNodeID == e.data.node.id) {
            document.getElementById('last-node-btn').innerHTML = "Last";
            lastNodeID = null;
        }
        isPathEdited = true;
        s.graph.dropNode(e.data.node.id);
        s.refresh();
    } else if (editAction == "addEdge") {
        if (node1IDGlobal == null) {
            node1IDGlobal = e.data.node.id;
            setNodeActive(node1IDGlobal);
        } else if (node2IDGlobal == null) {
            node2IDGlobal = e.data.node.id;
            setNodeActive(node2IDGlobal);
        }

        if (node1IDGlobal != null && node2IDGlobal != null) {
            addEdge(node1IDGlobal, node2IDGlobal);
            if (node1IDGlobal == firstNodeID && node1IDGlobal == lastNodeID) {
                colorOne(node1IDGlobal, colorMixed);
            } else if (node1IDGlobal == firstNodeID) {
                colorOne(node1IDGlobal, firstNodeColor);
            } else if (node1IDGlobal == lastNodeID) {
                colorOne(node1IDGlobal, lastNodeColor);
            } else {
                setNodeInactive(node1IDGlobal);
            }

            if (node2IDGlobal == firstNodeID && node2IDGlobal == lastNodeID) {
                colorOne(node2IDGlobal, colorMixed);
            } else if (node2IDGlobal == firstNodeID) {
                colorOne(node2IDGlobal, firstNodeColor);
            } else if (node2IDGlobal == lastNodeID) {
                colorOne(node2IDGlobal, lastNodeColor);
            } else {
                setNodeInactive(node2IDGlobal);
            }

            node1IDGlobal = node2IDGlobal = null;
            isPathEdited = true;
        }
        s.refresh();
    } else if (editAction == "editNode") {
        $(document).ready(function () {
            nodeIDEdit = e.data.node.id;
            document.querySelector("#nodeNameInput").value = e.data.node.label;
            $('#editNodeModalCenter').modal('show');
        });
    } else if (editAction == "selectFirstNode") {
        if (firstNodeID != null) {
            if (firstNodeID == lastNodeID) {
                colorOne(lastNodeID, lastNodeColor);
            } else {
                setNodeInactive(firstNodeID);
            }
        }
        firstNodeID = e.data.node.id;
        var element = document.getElementById('first-node-btn');
        element.innerHTML = e.data.node.label;
        element.classList.remove("active");
        if (firstNodeID == lastNodeID) {
            colorOne(firstNodeID, colorMixed);
        } else {
            colorOne(firstNodeID, firstNodeColor);
        }
        editAction = null;
        isPathEdited = true;
        s.refresh();
    } else if (editAction == "selectLastNode") {
        if (lastNodeID != null) {
            if (lastNodeID == firstNodeID) {
                colorOne(firstNodeID, firstNodeColor);
            } else {
                setNodeInactive(lastNodeID);
            }
        }
        lastNodeID = e.data.node.id;
        var element = document.getElementById('last-node-btn');
        element.innerHTML = e.data.node.label;
        element.classList.remove("active");
        if (firstNodeID == lastNodeID) {
            colorOne(lastNodeID, colorMixed);
        } else {
            colorOne(lastNodeID, lastNodeColor);
        }
        editAction = null;
        isPathEdited = true;
        s.refresh();
    }
});

document.querySelector('body').addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

var editEdgeId = null;
s.bind('rightClickEdge', function (e) {
    if (editAction == "removeEdge") {
        removeEdge(e.data.edge.id);
        isPathEdited = true;
    } else if (editAction == "editEdge") {
        $(document).ready(function () {
            editEdgeId = e.data.edge.id;
            document.querySelector("#edgeWeightInput").value = e.data.edge.label;
            $('#editEdgeModalCenter').modal('show');
        });
    }
});

function generateNodeWithCameraPosition(x, y) {
    return generateNode(s.camera.x + x,
        s.camera.y + y)
}

function createGraphMap() {
    var nodes = s.graph.nodes();
    var edges = s.graph.edges();
    var mapObj = {};
    var node;
    var edge;
    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        for (j = 0; j < edges.length; j++) {
            edge = edges[j];
            if (edge.source == node.id) {
                if (mapObj[node.id] == undefined) {
                    mapObj[node.id] = {};
                }
                mapObj[node.id][edge.target] = parseInt(edge.label);
            } else if (edge.target == node.id) {
                if (mapObj[node.id] == undefined) {
                    mapObj[node.id] = {};
                }
                mapObj[node.id][edge.source] = parseInt(edge.label);
            }
        }
    }
    return mapObj;
}

function calculateCost(nodeIDFrom, nodeIDTo) {
    var cost;
    s.graph.edges().forEach((edge) => {
        if (((edge.source == nodeIDFrom) && (edge.target == nodeIDTo)) || ((edge.target == nodeIDFrom) && (edge.source == nodeIDTo))) {
            cost = parseInt(edge.label);
            return;
        }
    });
    return cost;
}

function calculateTotalCost(nodeIDs) {
    var sum = 0;
    var len = nodeIDs.length;
    var visitedIDsPairs = [];
    if (nodeIDs != null) {
        for (var i = 0; i < len - 1; i++) {
            s.graph.edges().forEach((edge) => {
                var notAdded = true;
                for (var j = 0; j < visitedIDsPairs.length; j++) {
                    if ((visitedIDsPairs[j][0] == nodeIDs[i] && visitedIDsPairs[j][1] == nodeIDs[i + 1]) || (visitedIDsPairs[j][1] == nodeIDs[i] && visitedIDsPairs[j][0] == nodeIDs[i + 1])) {
                        notAdded = false;
                    }
                }

                if (notAdded && ((edge.source == nodeIDs[i] && nodeIDs[i + 1] == edge.target)) || ((edge.source == nodeIDs[i + 1] && nodeIDs[i] == edge.target))) {
                    visitedIDsPairs.push([nodeIDs[i], nodeIDs[i + 1]]);
                    sum += parseInt(edge.label);
                    return;
                }
            });
        }
    }
    return sum;
}

function findNextNodeID(currentNodeID, array) {
    var index = array.indexOf(currentNodeID);
    if (index >= array.length - 1)
        return null;
    else
        return array[index + 1];
}

function findPrevNodeID(currentNodeID, array) {
    var index = array.indexOf(currentNodeID);
    if (index <= 0)
        return null;
    else
        return array[index - 1];
}