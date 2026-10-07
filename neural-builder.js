const networkCanvas = document.getElementById("network");
const drawingContext = networkCanvas.getContext("2d");
const actionButton = document.getElementById("actionButton");
const resetButton = document.getElementById("resetButton");
const feedback = document.getElementById("feedback");
const signalStatus = document.getElementById("signalStatus");
const confidenceOutput = document.getElementById("confidence");
const scoreOutput = document.getElementById("score");
const progressBar = document.getElementById("progressBar");
const roundLabel = document.getElementById("roundLabel");
const roundTitle = document.getElementById("roundTitle");
const conceptTitle = document.getElementById("conceptTitle");
const conceptText = document.getElementById("conceptText");
const celebration = document.getElementById("celebration");
const celebrationTitle = document.getElementById("celebrationTitle");
const celebrationText = document.getElementById("celebrationText");
const nextButton = document.getElementById("nextButton");

const layers = [
    [{ x: .14, y: .28 }, { x: .14, y: .5 }, { x: .14, y: .72 }],
    [{ x: .5, y: .2 }, { x: .5, y: .5 }, { x: .5, y: .8 }],
    [{ x: .86, y: .35 }, { x: .86, y: .65 }]
];
const rounds = [
    {
        title: "Wire the first layer",
        concept: ["Connections carry patterns", "Every line is a possible connection. A good network keeps useful paths and avoids unnecessary ones."],
        target: [[0, 0], [1, 1], [2, 2]],
        reward: 45
    },
    {
        title: "Create local feature groups",
        concept: ["CNNs use local links", "Convolutional networks often connect a neuron to a small local region instead of every neuron. This saves work while finding patterns."],
        target: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 0], [2, 1]],
        reward: 70
    },
    {
        title: "Design the final network",
        concept: ["Connectivity shapes predictions", "Choose a useful, efficient path through both layer transitions. Too many or too few links can weaken a model."],
        target: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 0], [0, 1]],
        reward: 100
    }
];
let roundIndex = 0;
let score = 0;
let selected = new Set();
let selectedNode = null;

function edgeKey(layer, from, to) {
    return `${layer}-${from}-${to}`;
}

function allEdges() {
    const edges = [];
    for (let layer = 0; layer < layers.length - 1; layer += 1) {
        layers[layer].forEach((_, from) => {
            layers[layer + 1].forEach((__, to) => edges.push({ layer, from, to }));
        });
    }
    return edges;
}

function resizeNetwork() {
    const ratio = window.devicePixelRatio || 1;
    const rect = networkCanvas.getBoundingClientRect();
    networkCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
    networkCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
    drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawNetwork();
}

function nodePosition(layer, index) {
    return {
        x: layers[layer][index].x * networkCanvas.clientWidth,
        y: layers[layer][index].y * networkCanvas.clientHeight
    };
}

function pointToSegmentDistance(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    const x = start.x + ratio * dx;
    const y = start.y + ratio * dy;
    return Math.hypot(point.x - x, point.y - y);
}

function drawNetwork() {
    const width = networkCanvas.clientWidth;
    const height = networkCanvas.clientHeight;
    drawingContext.clearRect(0, 0, width, height);
    allEdges().forEach(({ layer, from, to }) => {
        const start = nodePosition(layer, from);
        const end = nodePosition(layer + 1, to);
        const active = selected.has(edgeKey(layer, from, to));
        drawingContext.beginPath();
        drawingContext.moveTo(start.x, start.y);
        drawingContext.lineTo(end.x, end.y);
        drawingContext.lineWidth = active ? 4 : 1.5;
        drawingContext.strokeStyle = active ? "#00eaff" : "rgba(105,130,210,.25)";
        drawingContext.shadowColor = active ? "#00eaff" : "transparent";
        drawingContext.shadowBlur = active ? 14 : 0;
        drawingContext.stroke();
        drawingContext.shadowBlur = 0;
    });
    layers.forEach((layer, layerIndex) => layer.forEach((_, nodeIndex) => {
        const node = nodePosition(layerIndex, nodeIndex);
        const isSelectedSource = selectedNode && selectedNode.layer === layerIndex && selectedNode.index === nodeIndex;
        const active = allEdges().some((edge) =>
            selected.has(edgeKey(edge.layer, edge.from, edge.to)) &&
            ((edge.layer === layerIndex && edge.from === nodeIndex) || (edge.layer + 1 === layerIndex && edge.to === nodeIndex))
        );
        const color = active ? (layerIndex === 1 ? "#ff4ecd" : "#00eaff") : "#33416d";
        drawingContext.beginPath();
        drawingContext.arc(node.x, node.y, layerIndex === 2 ? 25 : 21, 0, Math.PI * 2);
        drawingContext.fillStyle = active ? "rgba(0,234,255,.15)" : "rgba(12,19,46,.95)";
        drawingContext.shadowColor = color;
        drawingContext.shadowBlur = active ? 20 : 0;
        drawingContext.fill();
        drawingContext.shadowBlur = 0;
        drawingContext.lineWidth = 2;
        drawingContext.strokeStyle = color;
        drawingContext.stroke();
        if (isSelectedSource) {
            drawingContext.beginPath();
            drawingContext.arc(node.x, node.y, 31, 0, Math.PI * 2);
            drawingContext.strokeStyle = "#ffffff";
            drawingContext.lineWidth = 2;
            drawingContext.setLineDash([4, 4]);
            drawingContext.stroke();
            drawingContext.setLineDash([]);
        }
        drawingContext.fillStyle = active ? "#f7f9ff" : "#7280a6";
        drawingContext.font = "bold 11px Arial";
        drawingContext.textAlign = "center";
        drawingContext.textBaseline = "middle";
        drawingContext.fillText(layerIndex === 0 ? `x${nodeIndex + 1}` : layerIndex === 1 ? `h${nodeIndex + 1}` : `ŷ${nodeIndex + 1}`, node.x, node.y);
    }));
}

function renderRound() {
    selected = new Set();
    selectedNode = null;
    const currentRound = rounds[roundIndex];
    roundLabel.textContent = `0${roundIndex + 1} / 03`;
    roundTitle.textContent = currentRound.title;
    conceptTitle.textContent = currentRound.concept[0];
    conceptText.textContent = currentRound.concept[1];
    progressBar.style.width = `${((roundIndex + 1) / rounds.length) * 100}%`;
    signalStatus.textContent = "SELECT LINKS";
    signalStatus.className = "signal-status";
    confidenceOutput.textContent = "—";
    feedback.className = "feedback";
    feedback.textContent = "Click a source neuron, then a neuron in the next layer.";
    actionButton.innerHTML = 'Check connections <span>→</span>';
    drawNetwork();
}

function selectNeuronAt(clientX, clientY) {
    const rect = networkCanvas.getBoundingClientRect();
    const point = { x: clientX - rect.left, y: clientY - rect.top };
    let closest = null;
    layers.forEach((layer, layerIndex) => layer.forEach((_, nodeIndex) => {
        const distance = Math.hypot(point.x - nodePosition(layerIndex, nodeIndex).x, point.y - nodePosition(layerIndex, nodeIndex).y);
        if (distance < 32 && (!closest || distance < closest.distance)) closest = { layer: layerIndex, index: nodeIndex, distance };
    }));
    if (!closest) return;
    if (!selectedNode) {
        if (closest.layer === layers.length - 1) {
            feedback.className = "feedback warning";
            feedback.textContent = "Start from an input or hidden neuron, not an output.";
            return;
        }
        selectedNode = closest;
        feedback.className = "feedback";
        feedback.textContent = "Source selected. Now click a neuron in the next layer.";
        drawNetwork();
        return;
    }
    if (closest.layer !== selectedNode.layer + 1) {
        feedback.className = "feedback warning";
        feedback.textContent = "Connections can only go to the next layer.";
        return;
    }
    const key = edgeKey(selectedNode.layer, selectedNode.index, closest.index);
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    selectedNode = null;
    feedback.className = "feedback";
    feedback.textContent = `${selected.size} connection${selected.size === 1 ? "" : "s"} selected. Choose another source neuron.`;
    drawNetwork();
}

function checkConnections() {
    const target = new Set(rounds[roundIndex].target.map(([from, to]) => edgeKey(0, from, to)));
    const targetSecondLayer = new Set(rounds[roundIndex].target.slice(Math.ceil(rounds[roundIndex].target.length / 2)).map(([from, to]) => edgeKey(1, from % 3, to % 2)));
    targetSecondLayer.forEach((key) => target.add(key));
    const correct = [...selected].filter((key) => target.has(key)).length;
    const wrong = [...selected].filter((key) => !target.has(key)).length;
    const missed = [...target].filter((key) => !selected.has(key)).length;
    const total = target.size;
    const result = Math.max(0, Math.round(((correct - wrong * .35) / total) * 100));
    confidenceOutput.textContent = `${result}%`;
    if (result < 65) {
        feedback.className = "feedback warning";
        feedback.textContent = `Try again: ${missed} useful path${missed === 1 ? "" : "s"} still need to be connected.`;
        return;
    }
    score += Math.round(rounds[roundIndex].reward * result / 100);
    scoreOutput.textContent = score;
    signalStatus.textContent = "NETWORK READY";
    signalStatus.className = "signal-status active";
    feedback.className = "feedback success";
    feedback.textContent = `Useful connectivity found with ${result}% network quality.`;
    celebrationTitle.textContent = roundIndex === rounds.length - 1 ? "Network optimized!" : "Good architecture!";
    celebrationText.textContent = `You earned ${Math.round(rounds[roundIndex].reward * result / 100)} XP. Correct links are rewarded; unnecessary links lower your score.`;
    nextButton.textContent = roundIndex === rounds.length - 1 ? "Play again ↻" : "Next mission →";
    celebration.classList.add("open");
    celebration.setAttribute("aria-hidden", "false");
}

function nextRound() {
    document.activeElement.blur();
    celebration.classList.remove("open");
    celebration.setAttribute("aria-hidden", "true");
    if (roundIndex === rounds.length - 1) {
        roundIndex = 0;
        score = 0;
        scoreOutput.textContent = score;
    } else roundIndex += 1;
    renderRound();
}

networkCanvas.addEventListener("click", (event) => selectNeuronAt(event.clientX, event.clientY));
actionButton.addEventListener("click", checkConnections);
resetButton.addEventListener("click", renderRound);
nextButton.addEventListener("click", nextRound);
window.addEventListener("resize", resizeNetwork);
renderRound();
resizeNetwork();
