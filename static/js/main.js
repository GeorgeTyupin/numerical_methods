import { drawBaseGraph, drawStep, initPlot } from './plot.js';
import { calculateMethod } from './api.js';

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

function updateMethodUI() {
    const method = methodSelect.value;
    if (method === 'newton' || method === 'simple_iter') {
        rangeGroup.classList.add('hidden');
        initialGuessGroup.classList.remove('hidden');
    } else {
        rangeGroup.classList.remove('hidden');
        initialGuessGroup.classList.add('hidden');
    }
}

function getGraphCenterAndSpan() {
    const method = methodSelect.value;
    if (method === 'newton' || method === 'simple_iter') {
        const x0Str = inputX0.value.replace(',', '.');
        const x0 = parseFloat(x0Str) || 2.5;
        // Для Ньютона строим график вокруг начальной точки
        return { center: x0, span: 5 };
    } else {
        const aStr = inputA.value.replace(',', '.');
        const bStr = inputB.value.replace(',', '.');
        const a = parseFloat(aStr) || -10;
        const b = parseFloat(bStr) || 10;
        return { center: (a + b) / 2, span: Math.abs(b - a) / 2 + Math.abs(b - a) * 0.5 };
    }
}

function handleBaseGraphUpdate() {
    const expr = formulaInput.value;
    const { center, span } = getGraphCenterAndSpan();
    drawBaseGraph(expr, center, span);
}

// Event Listeners
methodSelect.addEventListener('change', () => {
    updateMethodUI();
    handleBaseGraphUpdate();
});

let debounceTimer;
const debouncedUpdate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleBaseGraphUpdate, 500);
};

formulaInput.addEventListener('input', debouncedUpdate);
inputA.addEventListener('input', debouncedUpdate);
inputB.addEventListener('input', debouncedUpdate);
inputX0.addEventListener('input', debouncedUpdate);

precisionSlider.addEventListener('input', (e) => {
    precisionValue.textContent = `1e-${e.target.value}`;
});

document.addEventListener('DOMContentLoaded', () => {
    initPlot();
    updateMethodUI();
    handleBaseGraphUpdate();
});

// Calculate Logic
btnCalculate.addEventListener('click', async () => {
    const method = methodSelect.value;
    const task = document.getElementById('task-select').value;
    const formula = formulaInput.value.trim();
    const epsilon = Math.pow(10, -parseInt(precisionSlider.value));
    
    if (!formula) {
        alert("Пожалуйста, введите формулу");
        return;
    }

    const payload = { formula, epsilon };

    if (method === 'bisection') {
        let a = parseFloat(inputA.value.replace(',', '.'));
        let b = parseFloat(inputB.value.replace(',', '.'));
        if (isNaN(a) || isNaN(b)) {
            alert("Пожалуйста, введите корректные границы отрезка [a, b]");
            return;
        }
        payload.a = a;
        payload.b = b;
    } else {
        let x0 = parseFloat(inputX0.value.replace(',', '.'));
        if (isNaN(x0)) {
            alert("Пожалуйста, введите начальное приближение x0");
            return;
        }
        payload.x0 = x0;
    }

    plotLoader.classList.remove('hidden');
    
    try {
        const data = await calculateMethod(task, method, payload);
        
        if (!data.steps || data.steps.length === 0) {
            alert("Алгоритм не вернул шагов.");
            return;
        }
        
        // Центрируем график вокруг найденных шагов
        let minX = Infinity, maxX = -Infinity;
        data.steps.forEach(s => {
            const xp = s.x_prev !== undefined ? s.x_prev : s.XPrev;
            const xn = s.x_new !== undefined ? s.x_new : s.XNew;
            if (xp < minX) minX = xp;
            if (xn > maxX) maxX = xn;
            if (s.a !== undefined && s.a < minX) minX = s.a;
            if (s.b !== undefined && s.b > maxX) maxX = s.b;
        });
        
        let newCenter = (minX + maxX) / 2;
        let newSpan = Math.abs(maxX - minX) / 2 + 2; 

        drawBaseGraph(formula, newCenter, newSpan);

        currentSteps = data.steps;
        currentStepIndex = 0;
        
        resultsBox.classList.remove('hidden');
        resRoot.textContent = data.root.toFixed(6);
        resIters.textContent = data.iterations;
        resError.textContent = data.error.toExponential(2);
        
        totalStepsEl.textContent = currentSteps.length;
        currentStepEl.textContent = '1';
        
        stopPlayback();
        btnPrev.disabled = true;
        btnNext.disabled = currentSteps.length <= 1;
        btnPlayPause.disabled = currentSteps.length <= 1;
        
        drawStep(0, currentSteps, method, formula);
    } catch (err) {
        alert("Ошибка вычисления: " + err.message);
    } finally {
        plotLoader.classList.add('hidden');
    }
});

function nextStep() {
    if (currentStepIndex < currentSteps.length - 1) {
        currentStepIndex++;
        drawStep(currentStepIndex, currentSteps, methodSelect.value, formulaInput.value);
        currentStepEl.textContent = currentStepIndex + 1;
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
        drawStep(currentStepIndex, currentSteps, methodSelect.value, formulaInput.value);
        currentStepEl.textContent = currentStepIndex + 1;
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
            currentStepIndex = 0;
            drawStep(0, currentSteps, methodSelect.value, formulaInput.value);
            currentStepEl.textContent = 1;
        }
        isPlaying = true;
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        btnPlayPause.classList.add('animate-pulse');
        playInterval = setInterval(nextStep, 1000);
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
