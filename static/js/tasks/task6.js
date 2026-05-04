import { calculateMethod } from '../api.js';

const DEFAULT_POINTS = [
    [0, 1],
    [1, 0.5403],
    [2, -0.4161],
    [3, -0.98999],
    [4, -0.6536],
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
    buildPoints('points-task6', DEFAULT_POINTS);

    document.getElementById('add-point-task6')?.addEventListener('click', () => {
        const container = document.getElementById('points-task6');
        addPointRow(container, container.children.length);
    });
}

export async function calculate(plotLoader, onSteps) {
    const { x, y } = readPoints('points-task6');

    if (x.some(isNaN) || y.some(isNaN)) {
        alert('Проверьте корректность введённых данных');
        return;
    }

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task6', 'cubic_spline', { x, y });

        const segEl = document.getElementById('segments-task6');
        const resBox = document.getElementById('results-task6');
        if (segEl && resBox) {
            segEl.innerHTML = data.segments.map((s, i) =>
                `<div class="border-t border-white/5 pt-1">S${i}: [${s.x_left.toFixed(2)}, ${s.x_right.toFixed(2)}]<br>` +
                `a=${s.a.toFixed(4)} b=${s.b.toFixed(4)}<br>` +
                `c=${s.c.toFixed(4)} d=${s.d.toFixed(4)}</div>`
            ).join('');
            resBox.classList.remove('hidden');
        }

        onSteps(data.segments, 'cubic_spline', { x, y, curveX: data.curve_x, curveY: data.curve_y });
    } finally {
        plotLoader.classList.add('hidden');
    }
}
