var firstNodeID = null;
var lastNodeID = null;
var visitedNodeColor = "#333";

function colorOne(nodeID, color) {
    var node = s.graph.nodes(nodeID);
    if (node != undefined) {
        if (color == undefined) {
            s.graph.nodes(nodeID).color = visitedNodeColor;
        } else {
            s.graph.nodes(nodeID).color = color;
        }
    }
}

function setAllInactive() {
    s.graph.nodes().forEach((node) => {
        setNodeInactive(node.id);
    })
}

function colorAll(nodeIDs) {
    nodeIDs.forEach((nodeID) => {
        colorOne(nodeID);
    });
}

function reverseAllColors(nodeIDs = null) {
    if (nodeIDs == null) {
        s.graph.nodes().forEach((node) => {
            if (node.id != null && node.id == firstNodeID && firstNodeID == lastNodeID) {
                colorOne(node.id, colorMixed);
            } else if (node.id == firstNodeID) {
                colorOne(node.id, firstNodeColor);
            } else if (node.id == lastNodeID) {
                colorOne(node.id, lastNodeColor);
            } else {
                setNodeInactive(node.id);
            }
        });
    } else {
        nodeIDs.forEach((nodeID) => {
            if (nodeID != null && nodeID == firstNodeID && firstNodeID == lastNodeID) {
                colorOne(node.id, colorMixed);
            } else if (nodeID == firstNodeID) {
                colorOne(nodeID, firstNodeColor);
            } else if (nodeID == lastNodeID) {
                colorOne(nodeID, lastNodeColor);
            } else {
                setNodeInactive(nodeID);
            }
        });
    }
}

function updateTotalCost(totalCost) {
    document.getElementById("totalCost").innerHTML = "Total cost: " + totalCost;
}

function writeOneNode(nodeID, element) {
    var div = document.createElement("div");
    div.id = nodeID;
    div.innerHTML = s.graph.nodes(nodeID).label;
    element.appendChild(div);
}

function writeArrowWithCost(cost, element) {
    var arrow = document.createElement('i');
    arrow.className = "fas fa-arrow-down";
    element.appendChild(arrow);
    var costElement = document.createElement('span');
    costElement.style.cssText = "margin-left: 4px";
    costElement.innerHTML = cost
    element.appendChild(costElement);
}

function writeAll(nodeIDs, startIndex) {
    if (nodeIDs != null && nodeIDs.length > 0) {
        var pathText = document.getElementById("pathText");

        var len = nodeIDs.length;
        if (startIndex == 0) {
            writeOneNode(nodeIDs[startIndex], pathText);
            startIndex = 1;
        }

        for (var i = startIndex; i < len; i++) {
            var cost = calculateCost(nodeIDs[i - 1], nodeIDs[i]);
            writeArrowWithCost(cost, pathText);
            writeOneNode(nodeIDs[i], pathText);
        }

        var totalCost = calculateTotalCost(nodeIDs);
        return totalCost;
    }
}

function reverseWriteAll() {
    document.getElementById("totalCost").innerHTML = "Total cost: --";
    var pathText = document.getElementById("pathText");
    while (pathText.firstChild) {
        pathText.removeChild(pathText.firstChild);
    }
}

function visitEdgeBetweenNodes(node1ID, node2ID) {
    var edgeID = findEdgeIDBetweenNodes(node1ID, node2ID);
    if (typeof edgeID === 'string') {
        resizeAndColorEdge(edgeID);
    }
}

function revertVisitEdgeBetweenNodes(node1ID, node2ID) {
    var edgeID = findEdgeIDBetweenNodes(node1ID, node2ID);
    if (typeof edgeID === 'string') {
        revertResizeAndColorEdge(edgeID);
    }
}

function findEdgeIDBetweenNodes(node1ID, node2ID) {
    var edges = s.graph.edges();
    var edge;
    for (var j = 0; j < edges.length; j++) {
        edge = edges[j];
        if ((edge.source == node1ID && edge.target == node2ID) || (edge.source == node2ID && edge.target == node1ID)) {
            return edge.id;
        }
    }
}

function resizeAndColorEdge(edgeID) {
    var edge = s.graph.edges(edgeID);
    edge.size = 3;
    edge.color = "#333";
}

function revertResizeAndColorEdge(edgeID) {
    var edge = s.graph.edges(edgeID);
    edge.size = 2;
    edge.color = "#ccc";
}

function resizeAndColorEdges(nodeIDs, visit = false) {
    var len = nodeIDs.length - 1;
    var edgeID;

    if (len == 0) {
        edgeID = findEdgeIDBetweenNodes(nodeIDs[0], nodeIDs[0]);
        if (visit) {
            resizeAndColorEdge(edgeID);
        } else {
            revertResizeAndColorEdge(edgeID);
        }
    }

    for (var i = 0; i < len; i++) {
        edgeID = findEdgeIDBetweenNodes(nodeIDs[i], nodeIDs[i + 1]);
        if (typeof edgeID === 'string') {
            if (visit) {
                resizeAndColorEdge(edgeID);
            } else {
                revertResizeAndColorEdge(edgeID);
            }
        }
    }
}