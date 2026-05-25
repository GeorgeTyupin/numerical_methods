import { calculateMethod } from '../api.js';

export function init() {
    // Дефолтные значения прописаны в HTML для вар. 5
}

export async function calculate(plotLoader, onSteps) {
    const p  = document.getElementById('p-task11')?.value?.trim() || '0';
    const q  = document.getElementById('q-task11')?.value?.trim() || '0';
    const f  = document.getElementById('f-task11')?.value?.trim() || '0';
    const a  = parseFloat(document.getElementById('a-task11')?.value);
    const b  = parseFloat(document.getElementById('b-task11')?.value);
    const aA = parseFloat(document.getElementById('alpha-a-task11')?.value);
    const bA = parseFloat(document.getElementById('beta-a-task11')?.value);
    const gA = parseFloat(document.getElementById('gamma-a-task11')?.value);
    const aB = parseFloat(document.getElementById('alpha-b-task11')?.value);
    const bB = parseFloat(document.getElementById('beta-b-task11')?.value);
    const gB = parseFloat(document.getElementById('gamma-b-task11')?.value);
    const h  = parseFloat(document.getElementById('h-task11')?.value);

    if ([a, b, aA, bA, gA, aB, bB, gB, h].some(isNaN)) {
        alert('Заполните все числовые поля'); return;
    }
    if (b <= a) { alert('b должно быть больше a'); return; }
    if (h <= 0) { alert('Шаг h должен быть положительным'); return; }

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task11', 'bvp', {
            p, q, f, a, b,
            alpha_a: aA, beta_a: bA, gamma_a: gA,
            alpha_b: aB, beta_b: bB, gamma_b: gB,
            h,
        });

        // Показываем решение в sidebar
        const resBox = document.getElementById('results-task11');
        const solEl  = document.getElementById('solution-task11');
        if (resBox && solEl && data.x && data.solution) {
            solEl.innerHTML = data.x.map((xi, i) =>
                `<div class="flex justify-between"><span class="text-gray-500">x=${xi.toFixed(4)}</span><span class="text-brand-accent">y=${data.solution[i]?.toFixed(6) ?? '?'}</span></div>`
            ).join('');
            resBox.classList.remove('hidden');
        }

        onSteps(data.steps, 'bvp', { x: data.x, solution: data.solution });
    } finally {
        plotLoader.classList.add('hidden');
    }
}
