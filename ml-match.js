const plot = document.getElementById("plot");
const context = plot.getContext("2d");
const boundary = document.getElementById("boundary");
const boundaryLine = document.getElementById("boundaryLine");
const boundaryValue = document.getElementById("boundaryValue");
const testButton = document.getElementById("testButton");
const feedback = document.getElementById("feedback");
const accuracy = document.getElementById("accuracy");
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

const rounds = [
    {
        title: "Warm-up: find the split",
        concept: ["Features become a map", "Each dot is an example. Its position is described by two features, such as size and speed."],
        points: [[18, 22, 0], [23, 40, 0], [29, 28, 0], [35, 47, 0], [70, 30, 1], [77, 44, 1], [67, 57, 1], [82, 63, 1]],
        target: 48,
        tolerance: 9,
        reward: 40
    },
    {
        title: "Training data: label the pattern",
        concept: ["Labels guide learning", "The colors are labels: known answers that let a model learn a pattern from training examples."],
        points: [[18, 66, 0], [29, 54, 0], [35, 72, 0], [43, 62, 0], [58, 24, 1], [68, 38, 1], [75, 20, 1], [83, 34, 1]],
        target: 52,
        tolerance: 8,
        reward: 60
    },
    {
        title: "Final test: make a prediction",
        concept: ["Accuracy is feedback", "A model is useful when it predicts new examples correctly. Accuracy tells us how often its predictions match the labels."],
        points: [[17, 24, 0], [24, 39, 0], [31, 30, 0], [40, 45, 0], [62, 25, 1], [69, 42, 1], [77, 31, 1], [84, 51, 1], [49, 49, 0], [54, 57, 1]],
        target: 51,
        tolerance: 7,
        reward: 100
    }
];

let roundIndex = 0;
let score = 0;
let locked = false;

function resizePlot() {
    const ratio = window.devicePixelRatio || 1;
    const rect = plot.getBoundingClientRect();
    plot.width = Math.max(1, Math.floor(rect.width * ratio));
    plot.height = Math.max(1, Math.floor(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawPlot();
}

function drawPlot() {
    const width = plot.clientWidth;
    const height = plot.clientHeight;
    const currentRound = rounds[roundIndex];
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(126, 151, 227, .12)";
    context.lineWidth = 1;
    for (let i = 1; i < 10; i += 1) {
        const x = (width / 10) * i;
        const y = (height / 10) * i;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
    }
    currentRound.points.forEach(([xValue, yValue, label], index) => {
        const x = (xValue / 100) * width;
        const y = height - (yValue / 100) * height;
        const color = label === 0 ? "#00eaff" : "#ff4ecd";
        context.beginPath();
        context.arc(x, y, index >= 8 ? 7 : 6, 0, Math.PI * 2);
        context.fillStyle = color;
        context.shadowColor = color;
        context.shadowBlur = 14;
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = "rgba(255,255,255,.4)";
        context.stroke();
    });
}

function updateBoundary() {
    const value = Number(boundary.value);
    boundaryValue.value = `${value}%`;
    boundaryLine.style.left = `${value}%`;
}

function renderRound() {
    const currentRound = rounds[roundIndex];
    locked = false;
    roundLabel.textContent = `0${roundIndex + 1} / 03`;
    roundTitle.textContent = currentRound.title;
    conceptTitle.textContent = currentRound.concept[0];
    conceptText.textContent = currentRound.concept[1];
    boundary.value = currentRound.target - 15;
    updateBoundary();
    accuracy.textContent = "—";
    feedback.className = "feedback";
    feedback.textContent = "Drag the boundary, then test your model.";
    progressBar.style.width = `${((roundIndex + 1) / rounds.length) * 100}%`;
    drawPlot();
}

function testModel() {
    if (locked) return;
    const currentRound = rounds[roundIndex];
    const selected = Number(boundary.value);
    const distance = Math.abs(selected - currentRound.target);
    const result = Math.max(0, Math.round(100 - distance * 6));
    const passed = distance <= currentRound.tolerance;
    accuracy.textContent = `${result}%`;
    if (!passed) {
        feedback.className = "feedback warning";
        feedback.textContent = "A few examples are on the wrong side. Nudge the boundary and test again.";
        return;
    }
    locked = true;
    score += currentRound.reward;
    scoreOutput.textContent = score;
    feedback.className = "feedback success";
    feedback.textContent = `Strong model! You classified the training data with ${result}% accuracy.`;
    celebrationTitle.textContent = roundIndex === rounds.length - 1 ? "You trained a model!" : "Great split!";
    celebrationText.textContent = roundIndex === rounds.length - 1
        ? `You earned ${currentRound.reward} XP and learned the ML loop.`
        : `Your boundary separates the labels. +${currentRound.reward} XP`;
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
    } else {
        roundIndex += 1;
    }
    renderRound();
}

boundary.addEventListener("input", updateBoundary);
testButton.addEventListener("click", testModel);
nextButton.addEventListener("click", nextRound);
window.addEventListener("resize", resizePlot);
renderRound();
resizePlot();
