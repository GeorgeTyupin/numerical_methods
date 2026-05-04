import { calculateMethod } from '../api.js';

// Вариант 5
const DEFAULT_TRIDIAG_N = 4;
const DEFAULT_TRIDIAG = {
    a: [0, -1,  2, -1],
    b: [8,  7,  9,  5],
    c: [-2, -2, -4,  0],
    d: [10.0, 5.5, 15.5, 9.0]
};
// Та же матрица что и прогонка, развёрнутая в полную форму
const DEFAULT_SEIDEL = {
    matrix: [
        [ 8, -2,  0,  0],
        [-1,  7, -2,  0],
        [ 0,  2,  9, -4],
        [ 0,  0, -1,  5],
    ],
    vector: [10.0, 5.5, 15.5, 9.0],
};

function buildTridiagInputs(n) {
    const container = document.getElementById('tridiag-inputs-container');
    if (!container) return;
    container.innerHTML = '';

    const labels = [
        { key: 'a', label: 'a (нижняя)', cls: 'text-gray-400' },
        { key: 'b', label: 'b (главная)', cls: 'text-brand-accent' },
        { key: 'c', label: 'c (верхняя)', cls: 'text-gray-400' },
        { key: 'd', label: 'd (правая)', cls: 'text-yellow-400' },
    ];

    labels.forEach(({ key, label, cls }) => {
        const wrap = document.createElement('div');
        wrap.className = 'flex items-center gap-1';
        const lbl = document.createElement('span');
        lbl.className = `text-[10px] font-mono w-4 shrink-0 ${cls}`;
        lbl.textContent = key;
        lbl.title = label;
        wrap.appendChild(lbl);
        for (let i = 0; i < n; i++) {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.step = 'any';
            inp.className = `flex-1 w-0 bg-brand-surface border border-white/10 rounded-lg px-1 py-1 text-gray-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent text-center`;
            inp.dataset.tridiag = key;
            inp.dataset.idx = i;
            // Defaults
            const def = DEFAULT_TRIDIAG[key];
            inp.value = def ? (def[i] ?? 0) : 0;
            // Disable corners
            if (key === 'a' && i === 0) { inp.value = 0; inp.disabled = true; inp.className += ' opacity-30'; }
            if (key === 'c' && i === n - 1) { inp.value = 0; inp.disabled = true; inp.className += ' opacity-30'; }
            wrap.appendChild(inp);
        }
        container.appendChild(wrap);
    });
}

function buildMatrixSeidel(n) {
    const container = document.getElementById('matrix-input-task2');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('div');
        row.className = 'flex gap-1 items-center';
        for (let j = 0; j < n; j++) {
            const inp = document.createElement('input');
            inp.type = 'number'; inp.step = 'any';
            inp.className = 'matrix-cell flex-1 w-0 bg-brand-surface border border-white/10 rounded-lg px-2 py-1.5 text-gray-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent text-center';
            inp.dataset.row = i; inp.dataset.col = j;
            inp.value = (DEFAULT_SEIDEL.matrix[i] && DEFAULT_SEIDEL.matrix[i][j] !== undefined) ? DEFAULT_SEIDEL.matrix[i][j] : 0;
            row.appendChild(inp);
        }
        const sep = document.createElement('span');
        sep.className = 'text-gray-600 font-mono text-xs px-1';
        sep.textContent = '|';
        row.appendChild(sep);
        const bInp = document.createElement('input');
        bInp.type = 'number'; bInp.step = 'any';
        bInp.className = 'matrix-b flex-1 w-0 bg-brand-surface border border-brand-accent/30 rounded-lg px-2 py-1.5 text-brand-accent font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent text-center';
        bInp.dataset.row = i;
        bInp.value = DEFAULT_SEIDEL.vector[i] ?? 0;
        row.appendChild(bInp);
        container.appendChild(row);
    }
}

function readMatrix(n) {
    const container = document.getElementById('matrix-input-task2');
    const matrix = [], vector = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            row.push(parseFloat(container.querySelector(`[data-row="${i}"][data-col="${j}"]`)?.value || 0));
        }
        matrix.push(row);
        vector.push(parseFloat(container.querySelector(`.matrix-b[data-row="${i}"]`)?.value || 0));
    }
    return { matrix, vector };
}

export function init() {
    const methodSelect = document.getElementById('method-task2');
    const tridiagInput = document.getElementById('tridiag-input');
    const seidelInput = document.getElementById('seidel-input');
    const tridiagSize = document.getElementById('tridiag-size');
    const matrixSize = document.getElementById('matrix-size-task2');
    const slider = document.getElementById('precision-slider-task2');
    const sliderVal = document.getElementById('precision-value-task2');

    slider?.addEventListener('input', e => { sliderVal.textContent = `1e-${e.target.value}`; });

    methodSelect?.addEventListener('change', () => {
        const isTridiag = methodSelect.value === 'tridiagonal';
        tridiagInput.classList.toggle('hidden', !isTridiag);
        seidelInput.classList.toggle('hidden', isTridiag);
    });

    tridiagSize?.addEventListener('input', () => {
        buildTridiagInputs(parseInt(tridiagSize.value) || 4);
    });

    matrixSize?.addEventListener('input', () => {
        buildMatrixSeidel(parseInt(matrixSize.value) || DEFAULT_TRIDIAG_N);
    });

    buildTridiagInputs(DEFAULT_TRIDIAG_N);
    buildMatrixSeidel(DEFAULT_TRIDIAG_N);
    // Default: show tridiagonal
    tridiagInput?.classList.remove('hidden');
    seidelInput?.classList.add('hidden');
}

export async function calculate(plotLoader, onSteps) {
    const method = document.getElementById('method-task2').value;
    const epsilon = Math.pow(10, -parseInt(document.getElementById('precision-slider-task2').value));

    plotLoader.classList.remove('hidden');
    try {
        let data;
        if (method === 'tridiagonal') {
            const n = parseInt(document.getElementById('tridiag-size').value) || 4;
            const container = document.getElementById('tridiag-inputs-container');
            const readVec = key => Array.from(container.querySelectorAll(`[data-tridiag="${key}"]`)).map(el => parseFloat(el.value || 0));
            data = await calculateMethod('task2', 'tridiagonal', {
                a: readVec('a'), b: readVec('b'), c: readVec('c'), d: readVec('d')
            });
        } else {
            const n = parseInt(document.getElementById('matrix-size-task2').value) || DEFAULT_TRIDIAG_N;
            const { matrix, vector } = readMatrix(n);
            data = await calculateMethod('task2', 'seidel', { matrix, vector, epsilon });
        }

        const solEl = document.getElementById('solution-task2');
        const resBox = document.getElementById('results-task2');
        const iterEl = document.getElementById('iter-task2');
        if (solEl && resBox) {
            solEl.textContent = data.solution.map((v, i) => `x${i+1} = ${v.toFixed(6)}`).join('\n');
            if (iterEl) iterEl.textContent = data.iterations ?? '—';
            resBox.classList.remove('hidden');
        }

        onSteps(data.steps, method);
    } finally {
        plotLoader.classList.add('hidden');
    }
}
