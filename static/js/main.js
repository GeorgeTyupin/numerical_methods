import { drawBaseGraph, drawStep, initPlot, drawMatrixHeatmap, drawConvergence, drawInterpolation, drawSpline } from './plot.js';
import { calculateMethod } from './api.js';
import { evaluateMathStr } from './math_util.js';
import * as Task1 from './tasks/task1.js';
import * as Task2 from './tasks/task2.js';
import * as Task3 from './tasks/task3.js';
import * as Task5 from './tasks/task5.js';
import * as Task6 from './tasks/task6.js';

// ─── State ──────────────────────────────────────────────────────────────────
let activeTask = 'task1';
let currentSteps = [];
let currentStepIndex = 0;
let isPlaying = false;
let playInterval = null;
let currentMethod = '';
let currentExtra = null;
const initializedTasks = new Set();

// ─── DOM ─────────────────────────────────────────────────────────────────────
const plotLoader    = document.getElementById('plot-loader');
const playerControls = document.getElementById('player-controls');
const currentStepEl  = document.getElementById('current-step');
const totalStepsEl   = document.getElementById('total-steps');
const btnPrev        = document.getElementById('btn-prev');
const btnNext        = document.getElementById('btn-next');
const btnPlayPause   = document.getElementById('btn-play-pause');
const iconPlay       = document.getElementById('icon-play');
const iconPause      = document.getElementById('icon-pause');

// ─── Tab switching ────────────────────────────────────────────────────────────
const TASK_META = {
    task1: { title: 'Задание 1: СЛАУ', desc: 'Метод Гаусса, метод простой итерации' },
    task2: { title: 'Задание 2: СЛАУ (спец.)', desc: 'Метод прогонки, метод Зейделя' },
    task3: { title: 'Задание 3: Собственные значения', desc: 'Метод вращения Якоби' },
    task4: { title: 'Задание 4: Корни уравнений', desc: 'Дихотомия, Ньютон, простая итерация' },
    task5: { title: 'Задание 5: Интерполяция', desc: 'Многочлены Лагранжа и Ньютона' },
    task6: { title: 'Задание 6: Кубические сплайны', desc: 'Кубический сплайн дефекта 1' },
};

function switchTask(taskId) {
    if (activeTask === taskId) return;
    activeTask = taskId;

    // Update tabs
    document.querySelectorAll('.task-tab').forEach(btn => {
        const active = btn.dataset.task === taskId;
        btn.classList.toggle('bg-brand-surface', active);
        btn.classList.toggle('text-brand-accent', active);
        btn.classList.toggle('shadow-neon', active);
        btn.classList.toggle('text-gray-400', !active);
    });

    // Update header
    const meta = TASK_META[taskId] || {};
    document.getElementById('task-title').textContent = meta.title || taskId;
    document.getElementById('task-desc').textContent = meta.desc || '';

    // Show/hide forms
    document.querySelectorAll('.task-form').forEach(f => f.classList.add('hidden'));
    document.getElementById(`form-${taskId}`)?.classList.remove('hidden');

    // Player only for task4
    playerControls.classList.toggle('hidden', taskId !== 'task4');

    // Reset steps
    stopPlayback();
    currentSteps = [];
    currentStepIndex = 0;

    // Init task on first activation
    if (!initializedTasks.has(taskId)) {
        initTask(taskId);
        initializedTasks.add(taskId);
    }

    // Reset plot
    Plotly.react('plot', [], {
        paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#9ca3af' }, margin: { t: 40, r: 20, b: 40, l: 40 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.2)' },
        yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.2)' },
    });

    if (taskId === 'task4') {
        handleBaseGraphUpdate();
    }
}

function initTask(taskId) {
    switch (taskId) {
        case 'task1': Task1.init(); break;
        case 'task2': Task2.init(); break;
        case 'task3': Task3.init(); break;
        case 'task5': Task5.init(); break;
        case 'task6': Task6.init(); break;
    }
}

// ─── Task 4 (existing logic) ─────────────────────────────────────────────────
const methodSelect = document.getElementById('method-task4');
const formulaInput = document.getElementById('formula-input');
const inputA       = document.getElementById('input-a');
const inputB       = document.getElementById('input-b');
const inputX0      = document.getElementById('input-x0');
const rangeGroup   = document.getElementById('range-group');
const initialGuessGroup = document.getElementById('initial-guess-group');
const precisionSlider   = document.getElementById('precision-slider');
const precisionValue    = document.getElementById('precision-value');

function updateMethodUI() {
    const m = methodSelect?.value;
    rangeGroup?.classList.toggle('hidden', m === 'newton' || m === 'simple_iter');
    initialGuessGroup?.classList.toggle('hidden', m === 'dichotomy');
}

function getGraphCenterAndSpan() {
    const m = methodSelect?.value;
    if (m === 'newton' || m === 'simple_iter') {
        const x0 = parseFloat(inputX0?.value.replace(',', '.')) || 2.5;
        return { center: x0, span: 5 };
    }
    const a = parseFloat(inputA?.value.replace(',', '.')) || -10;
    const b = parseFloat(inputB?.value.replace(',', '.')) || 10;
    return { center: (a + b) / 2, span: Math.abs(b - a) / 2 + Math.abs(b - a) * 0.5 };
}

function handleBaseGraphUpdate() {
    if (activeTask !== 'task4') return;
    const expr = formulaInput?.value;
    if (!expr) return;
    const { center, span } = getGraphCenterAndSpan();
    drawBaseGraph(expr, center, span);
}

methodSelect?.addEventListener('change', () => { updateMethodUI(); handleBaseGraphUpdate(); });

let debounceTimer;
const debouncedUpdate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleBaseGraphUpdate, 500);
};
formulaInput?.addEventListener('input', debouncedUpdate);
inputA?.addEventListener('input', debouncedUpdate);
inputB?.addEventListener('input', debouncedUpdate);
inputX0?.addEventListener('input', debouncedUpdate);
precisionSlider?.addEventListener('input', e => { precisionValue.textContent = `1e-${e.target.value}`; });

// ─── Calculate dispatching ────────────────────────────────────────────────────
document.querySelectorAll('.btn-calculate').forEach(btn => {
    btn.addEventListener('click', async () => {
        const task = btn.dataset.task || activeTask;
        await handleCalculate(task);
    });
});

async function handleCalculate(task) {
    try {
        switch (task) {
            case 'task1':
                await Task1.calculate(plotLoader, (steps, method) => {
                    currentSteps = steps || [];
                    currentMethod = method;
                    currentExtra = null;
                    renderStepsForTask(task, steps, method, null);
                });
                break;
            case 'task2':
                await Task2.calculate(plotLoader, (steps, method) => {
                    currentSteps = steps || [];
                    currentMethod = method;
                    renderStepsForTask(task, steps, method, null);
                });
                break;
            case 'task3':
                await Task3.calculate(plotLoader, (steps, method, extra) => {
                    currentSteps = steps || [];
                    currentMethod = method;
                    currentExtra = extra;
                    renderStepsForTask(task, steps, method, extra);
                });
                break;
            case 'task4':
                await handleTask4Calculate();
                break;
            case 'task5':
                await Task5.calculate(plotLoader, (steps, method, extra) => {
                    currentSteps = steps || [];
                    currentMethod = method;
                    currentExtra = extra;
                    renderStepsForTask(task, steps, method, extra);
                });
                break;
            case 'task6':
                await Task6.calculate(plotLoader, (segments, method, extra) => {
                    currentSteps = segments || [];
                    currentMethod = method;
                    currentExtra = extra;
                    renderStepsForTask(task, segments, method, extra);
                });
                break;
        }
    } catch (err) {
        alert('Ошибка вычисления: ' + err.message);
        plotLoader.classList.add('hidden');
    }
}

function renderStepsForTask(task, steps, method, extra) {
    if (!steps || steps.length === 0) return;

    switch (task) {
        case 'task1':
            if (method === 'gauss') {
                drawMatrixHeatmap(steps[0].matrix, steps[0].vector, steps[0].pivot);
            } else {
                drawConvergence(steps.map(s => s.norm));
            }
            break;
        case 'task2':
            if (method === 'tridiagonal') {
                drawConvergence(steps.map((s, i) => i), 'Шаги прогонки', '#00f0ff');
            } else {
                drawConvergence(steps.map(s => s.norm));
            }
            break;
        case 'task3':
            drawMatrixHeatmap(steps[0].matrix);
            break;
        case 'task5':
            if (extra) drawInterpolation(extra.x, extra.y, extra.curveX, extra.curveY, extra.xs, extra.value);
            break;
        case 'task6':
            if (extra) drawSpline(extra.x, extra.y, extra.curveX, extra.curveY, 0, steps);
            break;
    }
}

// ─── Task 4 calculate ────────────────────────────────────────────────────────
async function handleTask4Calculate() {
    const method = methodSelect.value;
    const formula = formulaInput.value.trim();
    const epsilon = Math.pow(10, -parseInt(precisionSlider.value));

    if (!formula) { alert('Пожалуйста, введите формулу'); return; }

    const payload = { formula, epsilon };
    if (method === 'dichotomy') {
        const a = parseFloat(inputA.value.replace(',', '.'));
        const b = parseFloat(inputB.value.replace(',', '.'));
        if (isNaN(a) || isNaN(b)) { alert('Введите корректные границы [a, b]'); return; }
        payload.a = a; payload.b = b;
    } else {
        const x0 = parseFloat(inputX0.value.replace(',', '.'));
        if (isNaN(x0)) { alert('Введите начальное приближение x0'); return; }
        payload.x0 = x0;
    }

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task4', method, payload);
        if (!data.steps || data.steps.length === 0) { alert('Алгоритм не вернул шагов'); return; }

        let minX = Infinity, maxX = -Infinity;
        data.steps.forEach(s => {
            const xp = s.x_prev ?? s.XPrev; const xn = s.x_new ?? s.XNew;
            if (xp !== undefined && xp < minX) minX = xp;
            if (xn !== undefined && xn > maxX) maxX = xn;
            if (s.a !== undefined && s.a < minX) minX = s.a;
            if (s.b !== undefined && s.b > maxX) maxX = s.b;
        });
        const newCenter = (minX + maxX) / 2;
        const newSpan   = Math.abs(maxX - minX) / 2 + 2;
        drawBaseGraph(formula, newCenter, newSpan);

        currentSteps = data.steps;
        currentStepIndex = 0;
        currentMethod = method;

        document.getElementById('results-box').classList.remove('hidden');
        document.getElementById('res-root').textContent   = data.root.toFixed(6);
        document.getElementById('res-iters').textContent  = data.iterations;
        document.getElementById('res-error').textContent  = (data.error || 0).toExponential(2);

        totalStepsEl.textContent   = currentSteps.length;
        currentStepEl.textContent  = '1';
        stopPlayback();
        btnPrev.disabled      = true;
        btnNext.disabled      = currentSteps.length <= 1;
        btnPlayPause.disabled = currentSteps.length <= 1;
        drawStep(0, currentSteps, method, formula);
    } finally {
        plotLoader.classList.add('hidden');
    }
}

// ─── Player (task4 only) ──────────────────────────────────────────────────────
function nextStep() {
    if (currentStepIndex < currentSteps.length - 1) {
        currentStepIndex++;
        drawStep(currentStepIndex, currentSteps, currentMethod, formulaInput.value);
        currentStepEl.textContent = currentStepIndex + 1;
        btnPrev.disabled = false;
        if (currentStepIndex === currentSteps.length - 1) { btnNext.disabled = true; stopPlayback(); }
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        drawStep(currentStepIndex, currentSteps, currentMethod, formulaInput.value);
        currentStepEl.textContent = currentStepIndex + 1;
        btnNext.disabled = false;
        if (currentStepIndex === 0) btnPrev.disabled = true;
    }
}

function togglePlayback() {
    if (isPlaying) { stopPlayback(); return; }
    if (currentStepIndex === currentSteps.length - 1) {
        currentStepIndex = 0;
        drawStep(0, currentSteps, currentMethod, formulaInput.value);
        currentStepEl.textContent = 1;
    }
    isPlaying = true;
    iconPlay.classList.add('hidden'); iconPause.classList.remove('hidden');
    btnPlayPause.classList.add('animate-pulse');
    playInterval = setInterval(nextStep, 1000);
}

function stopPlayback() {
    isPlaying = false;
    iconPause?.classList.add('hidden'); iconPlay?.classList.remove('hidden');
    btnPlayPause?.classList.remove('animate-pulse');
    clearInterval(playInterval);
}

btnNext?.addEventListener('click', () => { stopPlayback(); nextStep(); });
btnPrev?.addEventListener('click', () => { stopPlayback(); prevStep(); });
btnPlayPause?.addEventListener('click', togglePlayback);

// ─── Init ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.task-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTask(btn.dataset.task));
});

document.addEventListener('DOMContentLoaded', () => {
    initPlot();
    switchTask('task1');
    updateMethodUI();
});
