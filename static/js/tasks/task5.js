import { calculateMethod } from '../api.js';

// Вариант 5: дефолтные узловые точки
const DEFAULT_POINTS = [
    [0, 1],
    [1, 0.5403],
    [2, -0.4161],
    [3, -0.98999],
    [4, -0.6536],
];
const DEFAULT_XS = 1.5;

function buildPoints(containerId, points) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    points.forEach((pt, idx) => addPointRow(container, idx, pt[0], pt[1]));
}

function addPointRow(container, idx, xVal = 0, yVal = 0) {
    const row = document.createElement('div');
    row.className = 'flex gap-1 items-center';
    row.dataset.idx = idx;

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

    const lbl = document.createElement('span');
    lbl.className = 'point-lbl text-[10px] text-gray-600 font-mono w-4 shrink-0 text-right';
    lbl.textContent = `${idx}`;

    row.appendChild(lbl);
    row.appendChild(xInp);
    row.appendChild(yInp);
    row.appendChild(delBtn);
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
    buildPoints('points-task5', DEFAULT_POINTS);
    document.getElementById('xs-task5').value = DEFAULT_XS;

    document.getElementById('add-point-task5')?.addEventListener('click', () => {
        const container = document.getElementById('points-task5');
        addPointRow(container, container.children.length);
    });
}

export async function calculate(plotLoader, onSteps) {
    const method = document.getElementById('method-task5').value;
    const { x, y } = readPoints('points-task5');
    const xs = parseFloat(document.getElementById('xs-task5').value);

    if (x.some(isNaN) || y.some(isNaN) || isNaN(xs)) {
        alert('Проверьте корректность введённых данных');
        return;
    }

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task5', method, { x, y, xs });

        const valEl = document.getElementById('value-task5');
        const resBox = document.getElementById('results-task5');
        if (valEl && resBox) {
            valEl.textContent = data.value.toFixed(8);
            resBox.classList.remove('hidden');
        }

        onSteps(data.steps, method, { x, y, xs, curveX: data.curve_x, curveY: data.curve_y, value: data.value });
    } finally {
        plotLoader.classList.add('hidden');
    }
}
