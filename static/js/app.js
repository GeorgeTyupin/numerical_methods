/// <reference lib="dom" />

// DOM Elements
const form = document.getElementById('calc-form');
const methodSelect = document.getElementById('method-select');
const formulaInput = document.getElementById('formula-input');
const inputA = document.getElementById('input-a');
const inputB = document.getElementById('input-b');
const inputX0 = document.getElementById('input-x0');
const rangeGroup = document.getElementById('range-group');
const initialGuessGroup = document.getElementById('initial-guess-group');
const precisionSlider = document.getElementById('precision-slider');
const precisionValue = document.getElementById('precision-value');
const btnCalculate = document.getElementById('btn-calculate');

// Player Controls
const btnPlayPause = document.getElementById('btn-play-pause');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const currentStepEl = document.getElementById('current-step');
const totalStepsEl = document.getElementById('total-steps');

// Results
const resultsBox = document.getElementById('results-box');
const resRoot = document.getElementById('res-root');
const resIters = document.getElementById('res-iters');
const resError = document.getElementById('res-error');

// Loader
const plotLoader = document.getElementById('plot-loader');

// State
let currentSteps = [];
let currentStepIndex = 0;
let isPlaying = false;
let playInterval = null;

// Graph Settings
const layoutTemplate = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif', color: '#9ca3af' },
    margin: { t: 40, r: 20, b: 40, l: 40 },
    xaxis: { 
        gridcolor: 'rgba(255,255,255,0.05)', 
        zerolinecolor: 'rgba(255,255,255,0.2)',
        zerolinewidth: 2,
    },
    yaxis: { 
        gridcolor: 'rgba(255,255,255,0.05)', 
        zerolinecolor: 'rgba(255,255,255,0.2)',
        zerolinewidth: 2,
    },
    showlegend: false,
    hovermode: 'closest'
};

// Initialize Plot
function initPlot() {
    Plotly.newPlot('plot', [{
        x: [], y: [], type: 'scatter', mode: 'lines',
        line: { color: '#00f0ff', width: 3, shape: 'spline' }
    }], layoutTemplate, { responsive: true, displayModeBar: false });
    
    // Draw initial demo graph
    updateBaseGraph();
}

// Very basic JS math evaluator for frontend graph preview (NOT FOR SOLVING)
// Backend govaluate handles the real math and validation
function evaluateMathStr(expr, x) {
    try {
        // Replace ^ with ** for JS eval
        let jsExpr = expr.replace(/\^/g, '**');
        // Add Math. prefix to common functions
        jsExpr = jsExpr.replace(/sin|cos|tan|log|exp|sqrt/g, match => `Math.${match}`);
        // Basic evaluation
        return new Function('x', `return ${jsExpr}`)(x);
    } catch (e) {
        return null;
    }
}

// Generate data for background function curve
function updateBaseGraph() {
    const expr = formulaInput.value;
    const a = parseFloat(inputA.value) || -10;
    const b = parseFloat(inputB.value) || 10;
    
    // Expand viewing area slightly beyond [a, b]
    const margin = Math.abs(b - a) * 0.5;
    const startObj = a - margin;
    const endObj = b + margin;
    
    const xVals = [];
    const yVals = [];
    const step = (endObj - startObj) / 200;
    
    for (let x = startObj; x <= endObj; x += step) {
        let y = evaluateMathStr(expr, x);
        if (y !== null && !isNaN(y) && Math.abs(y) < 10000) { // filter extreme values
            xVals.push(x);
            yVals.push(y);
        }
    }
    
    const trace = {
        x: xVals,
        y: yVals,
        type: 'scatter',
        mode: 'lines',
        name: 'f(x)',
        line: { color: '#00f0ff', width: 3, shape: 'spline' }
    };

    Plotly.react('plot', [trace], layoutTemplate);
}

// Debounce for graph update on typing
let debounceTimer;
formulaInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateBaseGraph, 500);
});
inputA.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateBaseGraph, 500);
});
inputB.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateBaseGraph, 500);
});

// Update precision display
precisionSlider.addEventListener('input', (e) => {
    precisionValue.textContent = `1e-${e.target.value}`;
});

// Toggle inputs based on method
methodSelect.addEventListener('change', (e) => {
    if (e.target.value === 'newton' || e.target.value === 'simple_iter') {
        initialGuessGroup.classList.remove('hidden');
    } else {
        initialGuessGroup.classList.add('hidden');
    }
});

// --- API Interaction ---

btnCalculate.addEventListener('click', async () => {
    const method = methodSelect.value;
    const formulaEl = form.querySelector('#formula-input').value;
    
    let aStr = inputA.value;
    let bStr = inputB.value;
    // Replace commas with dots if user entered them
    aStr = aStr.replace(',', '.');
    bStr = bStr.replace(',', '.');

    const a = parseFloat(aStr);
    const b = parseFloat(bStr);
    const epsilon = Math.pow(10, -parseInt(precisionSlider.value));

    // Валидация
    if (!formulaEl.trim()) {
        alert("Пожалуйста, введите формулу");
        return;
    }
    if (isNaN(a) || isNaN(b)) {
         alert("Пожалуйста, введите корректные границы отрезка [a, b]");
         return;
    }

    const payload = {
        formula: formulaEl,
        epsilon: epsilon
    };

    if (method === 'bisection') {
        payload.a = a;
        payload.b = b;
    }

    if (method === 'newton' || method === 'simple_iter') {
        let x0Str = inputX0.value.replace(',', '.');
        payload.x0 = parseFloat(x0Str);
        if (isNaN(payload.x0)) {
            alert("Пожалуйста, введите начальное приближение x0");
            return;
        }
    }

    plotLoader.classList.remove('hidden');
    
    // Получаем текущую выбранную задачу (task4, task1 и т.д.)
    const task = document.getElementById('task-select').value;
    
    try {
        const response = await fetch(`/api/v1/calculate/${task}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Server error');
        }
        
        // Expected response format: { root: float, iterations: int, error: float, steps: [...] }
        handleCalculationResult(data);
        
    } catch (err) {
        alert("Ошибка вычисления: " + err.message);
    } finally {
        plotLoader.classList.add('hidden');
    }
});

function handleCalculationResult(data) {
    if (!data.steps || data.steps.length === 0) {
        alert("Алгоритм не вернул шагов.");
        return;
    }
    
    currentSteps = data.steps;
    currentStepIndex = 0;
    
    // Update stats
    resultsBox.classList.remove('hidden');
    resRoot.textContent = data.root.toFixed(6);
    resIters.textContent = data.iterations;
    resError.textContent = data.error.toExponential(2);
    
    totalStepsEl.textContent = currentSteps.length;
    currentStepEl.textContent = '1';
    
    // Show first step
    drawStep(0);
    
    // Reset player
    stopPlayback();
    btnPrev.disabled = true;
    btnNext.disabled = currentSteps.length <= 1;
    btnPlayPause.disabled = currentSteps.length <= 1;
}

// --- Visualization & Player ---

function drawStep(index) {
    if (index < 0 || index >= currentSteps.length) return;
    
    const stepData = currentSteps[index];
    const method = methodSelect.value;
    
    // We always keep the first trace (the base function curve)
    // We add new traces for the step visualization
    
    let stepTraces = [];
    
    if (method === 'bisection') {
        // Step data should contain: a, b, c, f(c)
        // Draw vertical lines for A, B, C
        const yMax = evaluateMathStr(formulaInput.value, stepData.a) || 5; 
        
        stepTraces.push({
            x: [stepData.a, stepData.a], y: [-10, 10], // mock height
            mode: 'lines', name: 'a', line: { color: '#ff3366', width: 2, dash: 'dash' }
        });
        stepTraces.push({
            x: [stepData.b, stepData.b], y: [-10, 10], 
            mode: 'lines', name: 'b', line: { color: '#ff3366', width: 2, dash: 'dash' }
        });
        stepTraces.push({
            x: [stepData.c], y: [0], 
            mode: 'markers', name: 'c (mid)', marker: { color: '#00f0ff', size: 10, symbol: 'circle-dot' }
        });
    } else if (method === 'newton') {
        // Step data: x_prev, f(x_prev), f'(x_prev), x_new
        // Draw tangent line
        const x_prev = stepData.x_prev;
        const fx = stepData.fx;
        const x_new = stepData.x_new;
        
        stepTraces.push({
            x: [x_prev, x_new], y: [fx, 0], 
            mode: 'lines', name: 'Tangent', line: { color: '#7000ff', width: 2 }
        });
        stepTraces.push({
            x: [x_prev, x_new], y: [fx, 0], 
            mode: 'markers', name: 'Points', marker: { color: ['#ffffff', '#00f0ff'], size: 8 }
        });
        stepTraces.push({
            x: [x_new, x_new], y: [0, evaluateMathStr(formulaInput.value, x_new)], 
            mode: 'lines', name: 'Projection', line: { color: 'rgba(255,255,255,0.3)', width: 1, dash: 'dot' }
        });
    } else if (method === 'simple_iter') {
        // Step data: x_prev, x_new, fx
        const x_prev = stepData.x_prev;
        const x_new = stepData.x_new;
        const fx = typeof stepData.fx !== 'undefined' ? stepData.fx : evaluateMathStr(formulaInput.value, x_prev);
        
        stepTraces.push({
            x: [x_prev, x_new], y: [fx, evaluateMathStr(formulaInput.value, x_new)], 
            mode: 'lines', name: 'Iteration path', line: { color: '#7000ff', width: 2, dash: 'dot' }
        });
        stepTraces.push({
            x: [x_prev, x_new], y: [fx, evaluateMathStr(formulaInput.value, x_new)], 
            mode: 'markers', name: 'Points', marker: { color: ['#ffffff', '#00f0ff'], size: 8 }
        });
    }
    
    // Fetch base trace from current plot
    const graphDiv = document.getElementById('plot');
    const baseTrace = graphDiv.data[0];
    
    Plotly.react('plot', [baseTrace, ...stepTraces], layoutTemplate);
    currentStepEl.textContent = index + 1;
}

function nextStep() {
    if (currentStepIndex < currentSteps.length - 1) {
        currentStepIndex++;
        drawStep(currentStepIndex);
        btnPrev.disabled = false;
        if (currentStepIndex === currentSteps.length - 1) {
            btnNext.disabled = true;
            stopPlayback();
        }
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        drawStep(currentStepIndex);
        btnNext.disabled = false;
        if (currentStepIndex === 0) {
            btnPrev.disabled = true;
        }
    }
}

function togglePlayback() {
    if (isPlaying) {
        stopPlayback();
    } else {
        if (currentStepIndex === currentSteps.length - 1) {
            currentStepIndex = 0; // restart if at end
        }
        isPlaying = true;
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        btnPlayPause.classList.add('animate-pulse');
        
        playInterval = setInterval(nextStep, 1000); // 1 second per step
    }
}

function stopPlayback() {
    isPlaying = false;
    iconPause.classList.add('hidden');
    iconPlay.classList.remove('hidden');
    btnPlayPause.classList.remove('animate-pulse');
    clearInterval(playInterval);
}

btnNext.addEventListener('click', () => { stopPlayback(); nextStep(); });
btnPrev.addEventListener('click', () => { stopPlayback(); prevStep(); });
btnPlayPause.addEventListener('click', togglePlayback);

// Bootstrap
document.addEventListener('DOMContentLoaded', initPlot);
