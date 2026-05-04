import { calculateMethod } from '../api.js';

// Вариант 5: матрица зависит от n (номера варианта), структура одинакова для всех
const DEFAULT_MATRIX = [
    [5, 1, 0],
    [1, 5, 1],
    [0, 1, 5]
];

function buildSymMatrix(n, defaultMatrix) {
    const container = document.getElementById('matrix-input-task3');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('div');
        row.className = 'flex gap-1';
        for (let j = 0; j < n; j++) {
            const inp = document.createElement('input');
            inp.type = 'number'; inp.step = 'any';
            inp.className = 'matrix-cell flex-1 w-0 bg-brand-surface border border-white/10 rounded-lg px-2 py-1.5 text-gray-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent text-center';
            inp.dataset.row = i; inp.dataset.col = j;
            inp.value = (defaultMatrix && defaultMatrix[i] && defaultMatrix[i][j] !== undefined) ? defaultMatrix[i][j] : (i === j ? 1 : 0);
            // Mirror: when entering upper triangle, fill lower
            if (j > i) {
                inp.addEventListener('input', () => {
                    const mirror = container.querySelector(`[data-row="${j}"][data-col="${i}"]`);
                    if (mirror) mirror.value = inp.value;
                });
            }
            row.appendChild(inp);
        }
        container.appendChild(row);
    }
}

function readMatrix(n) {
    const container = document.getElementById('matrix-input-task3');
    return Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) =>
            parseFloat(container.querySelector(`[data-row="${i}"][data-col="${j}"]`)?.value || 0)
        )
    );
}

export function init() {
    const sizeInput = document.getElementById('matrix-size-task3');
    const slider = document.getElementById('precision-slider-task3');
    const sliderVal = document.getElementById('precision-value-task3');

    sizeInput?.addEventListener('input', () => {
        buildSymMatrix(parseInt(sizeInput.value) || 3, null);
    });
    slider?.addEventListener('input', e => { sliderVal.textContent = `1e-${e.target.value}`; });

    buildSymMatrix(3, DEFAULT_MATRIX);
}

export async function calculate(plotLoader, onSteps) {
    const n = parseInt(document.getElementById('matrix-size-task3').value) || 3;
    const epsilon = Math.pow(10, -parseInt(document.getElementById('precision-slider-task3').value));
    const matrix = readMatrix(n);

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task3', 'jacobi', { matrix, epsilon });

        const eigEl = document.getElementById('eigenvalues-task3');
        const resBox = document.getElementById('results-task3');
        const iterEl = document.getElementById('iter-task3');
        if (eigEl && resBox) {
            eigEl.textContent = data.eigenvalues.map((v, i) => `λ${i+1} = ${v.toFixed(6)}`).join('\n');
            if (iterEl) iterEl.textContent = data.iterations;
            resBox.classList.remove('hidden');
        }

        onSteps(data.steps, 'jacobi', { eigenvalues: data.eigenvalues, eigenvectors: data.eigenvectors });
    } finally {
        plotLoader.classList.add('hidden');
    }
}
