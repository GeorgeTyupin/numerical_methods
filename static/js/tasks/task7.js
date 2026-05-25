import { calculateMethod } from '../api.js';

// Вариант 5: таблица из задания 7
const DEFAULT_POINTS = [
    [0,    2.0],
    [0.12, 2.4],
    [0.19, 1.6],
    [0.35, 1.8],
    [0.4,  1.7],
    [0.45, 1.8],
    [0.62, 1.5],
    [0.71, 1.3],
    [0.84, 1.5],
    [0.91, 1.2],
    [1.0,  1.0],
];

function buildPoints(containerId, points) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    points.forEach((pt, idx) => addPointRow(container, idx, pt[0], pt[1]));
}

function addPointRow(container, idx, xVal = 0, yVal = 0) {
    const row = document.createElement('div');
    row.className = 'flex gap-1 items-center';

    const lbl = document.createElement('span');
    lbl.className = 'point-lbl text-[10px] text-gray-600 font-mono w-4 shrink-0 text-right';
    lbl.textContent = `${idx}`;

    const xInp = document.createElement('input');
    xInp.type = 'number'; xInp.step = 'any';
    xInp.className = 'point-x flex-1 w-0 bg-brand-surface border border-white/10 rounded-lg px-2 py-1.5 text-gray-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent text-center';
    xInp.value = xVal; xInp.placeholder = 'x';

    const yInp = document.createElement('input');
    yInp.type = 'number'; yInp.step = 'any';
    yInp.className = 'point-y flex-1 w-0 bg-brand-surface border border-brand-accent/30 rounded-lg px-2 py-1.5 text-brand-accent font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent text-center';
    yInp.value = yVal; yInp.placeholder = 'y';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors shrink-0';
    delBtn.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    delBtn.addEventListener('click', () => { row.remove(); renumberRows(container); });

    row.appendChild(lbl); row.appendChild(xInp); row.appendChild(yInp); row.appendChild(delBtn);
    container.appendChild(row);
}

function renumberRows(container) {
    Array.from(container.children).forEach((row, i) => {
        const lbl = row.querySelector('.point-lbl');
        if (lbl) lbl.textContent = `${i}`;
    });
}

function readPoints(containerId) {
    const container = document.getElementById(containerId);
    const x = [], y = [];
    Array.from(container.querySelectorAll('.point-x')).forEach(el => x.push(parseFloat(el.value)));
    Array.from(container.querySelectorAll('.point-y')).forEach(el => y.push(parseFloat(el.value)));
    return { x, y };
}

export function init() {
    buildPoints('points-task7', DEFAULT_POINTS);
    document.getElementById('add-point-task7')?.addEventListener('click', () => {
        const container = document.getElementById('points-task7');
        addPointRow(container, container.children.length);
    });
}

export async function calculate(plotLoader, onSteps) {
    const { x, y } = readPoints('points-task7');

    if (x.length < 3) { alert('Нужно минимум 3 точки'); return; }

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task7', 'lss', { x, y });

        // Показываем коэффициенты
        const resBox = document.getElementById('results-task7');
        const linEl  = document.getElementById('coeffs-linear-task7');
        const quadEl = document.getElementById('coeffs-quad-task7');
        if (resBox && linEl && quadEl) {
            const cl = data.coeffs_linear ?? [];
            const cq = data.coeffs_quad ?? [];
            linEl.textContent  = cl.map((c, i) => `a${i}=${c.toFixed(5)}`).join(', ');
            quadEl.textContent = cq.map((c, i) => `a${i}=${c.toFixed(5)}`).join(', ');
            resBox.classList.remove('hidden');
        }

        const extra = {
            x, y,
            curveX:       data.curve_x,
            curveYLinear: data.curve_y_linear,
            curveYQuad:   data.curve_y_quad,
            coeffsLinear: data.coeffs_linear,
            coeffsQuad:   data.coeffs_quad,
        };

        onSteps(data.steps, 'lss', extra);
    } finally {
        plotLoader.classList.add('hidden');
    }
}
