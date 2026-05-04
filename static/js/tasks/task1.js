import { calculateMethod } from '../api.js';

const DEFAULTS = {
    gauss: {
        matrix: [[4, -1, 0], [-1, 4, -1], [0, -1, 4]],
        vector: [1, 5, 1]
    },
    simple_iter: {
        matrix: [[10, 1, 1], [2, 10, 1], [2, 2, 10]],
        vector: [12, 13, 14]
    }
};

function buildMatrixInput(containerId, n, defaultMatrix, defaultVector, symmetric = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('div');
        row.className = 'flex gap-1 items-center';
        for (let j = 0; j < n; j++) {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.step = 'any';
            inp.className = 'matrix-cell flex-1 w-0 bg-brand-surface border border-white/10 rounded-lg px-2 py-1.5 text-gray-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all text-center';
            inp.dataset.row = i;
            inp.dataset.col = j;
            inp.value = (defaultMatrix && defaultMatrix[i] && defaultMatrix[i][j] !== undefined) ? defaultMatrix[i][j] : 0;
            if (symmetric && j < i) {
                inp.addEventListener('input', () => {
                    const mirror = container.querySelector(`[data-row="${j}"][data-col="${i}"]`);
                    if (mirror) mirror.value = inp.value;
                });
            }
            row.appendChild(inp);
        }
        // Separator
        const sep = document.createElement('span');
        sep.className = 'text-gray-600 font-mono text-xs px-1';
        sep.textContent = '|';
        row.appendChild(sep);
        // b vector input
        const bInp = document.createElement('input');
        bInp.type = 'number';
        bInp.step = 'any';
        bInp.className = 'matrix-b flex-1 w-0 bg-brand-surface border border-brand-accent/30 rounded-lg px-2 py-1.5 text-brand-accent font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all text-center';
        bInp.dataset.row = i;
        bInp.value = (defaultVector && defaultVector[i] !== undefined) ? defaultVector[i] : 0;
        row.appendChild(bInp);
        container.appendChild(row);
    }
}

function readMatrix(containerId, n) {
    const container = document.getElementById(containerId);
    const matrix = [];
    const vector = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            const el = container.querySelector(`[data-row="${i}"][data-col="${j}"]`);
            row.push(parseFloat(el?.value || 0));
        }
        matrix.push(row);
        const bEl = container.querySelector(`.matrix-b[data-row="${i}"]`);
        vector.push(parseFloat(bEl?.value || 0));
    }
    return { matrix, vector };
}

export function init() {
    const sizeInput = document.getElementById('matrix-size-task1');
    const methodSelect = document.getElementById('method-task1');
    const epsilonGroup = document.getElementById('epsilon-task1');
    const slider = document.getElementById('precision-slider-task1');
    const sliderVal = document.getElementById('precision-value-task1');

    const rebuildMatrix = () => {
        const n = parseInt(sizeInput.value) || 3;
        const method = methodSelect.value;
        const def = DEFAULTS[method] || DEFAULTS.gauss;
        buildMatrixInput('matrix-input-task1', n, def.matrix, def.vector);
    };

    sizeInput.addEventListener('input', rebuildMatrix);
    methodSelect.addEventListener('change', () => {
        epsilonGroup.classList.toggle('hidden', methodSelect.value === 'gauss');
        rebuildMatrix();
    });
    slider?.addEventListener('input', e => { sliderVal.textContent = `1e-${e.target.value}`; });

    rebuildMatrix();
}

export async function calculate(plotLoader, onSteps) {
    const method = document.getElementById('method-task1').value;
    const n = parseInt(document.getElementById('matrix-size-task1').value) || 3;
    const { matrix, vector } = readMatrix('matrix-input-task1', n);

    plotLoader.classList.remove('hidden');
    try {
        let data;
        if (method === 'gauss') {
            data = await calculateMethod('task1', 'gauss', { matrix, vector });
        } else {
            const epsilon = Math.pow(10, -parseInt(document.getElementById('precision-slider-task1').value));
            data = await calculateMethod('task1', 'simple_iter', { matrix, vector, epsilon });
        }

        // Show solution
        const solEl = document.getElementById('solution-task1');
        const resBox = document.getElementById('results-task1');
        const iterEl = document.getElementById('iter-task1');
        if (solEl && resBox) {
            solEl.textContent = data.solution.map((v, i) => `x${i+1} = ${v.toFixed(6)}`).join('\n');
            if (iterEl) iterEl.textContent = data.iterations ?? data.steps?.length ?? '—';
            resBox.classList.remove('hidden');
        }

        onSteps(data.steps, method);
    } finally {
        plotLoader.classList.add('hidden');
    }
}
