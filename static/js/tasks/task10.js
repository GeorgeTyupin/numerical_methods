import { calculateMethod } from '../api.js';

export function init() {
    // Нет дополнительной инициализации — поля в HTML с дефолтными значениями
}

export async function calculate(plotLoader, onSteps) {
    const formula = document.getElementById('formula-task10')?.value?.trim();
    const x0      = parseFloat(document.getElementById('x0-task10')?.value);
    const y0      = parseFloat(document.getElementById('y0-task10')?.value);
    const xEnd    = parseFloat(document.getElementById('xend-task10')?.value);
    const h       = parseFloat(document.getElementById('h-task10')?.value);

    if (!formula) { alert('Введите функцию y\' = f(x, y)'); return; }
    if (isNaN(x0) || isNaN(y0) || isNaN(xEnd) || isNaN(h)) { alert('Заполните все числовые поля'); return; }
    if (h <= 0) { alert('Шаг h должен быть положительным'); return; }
    if (xEnd <= x0) { alert('x_end должен быть больше x0'); return; }

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task10', 'cauchy', { formula, x0, y0, x_end: xEnd, h });

        // Результат
        const resBox      = document.getElementById('results-task10');
        const cntEl       = document.getElementById('points-count-task10');
        const diffEl      = document.getElementById('max-diff-task10');
        if (resBox && data.steps) {
            if (cntEl) cntEl.textContent = data.steps.length;
            const maxDiff = Math.max(...data.steps.map(s => s.diff ?? 0));
            if (diffEl) diffEl.textContent = maxDiff.toExponential(4);
            resBox.classList.remove('hidden');
        }

        onSteps(data.steps, 'cauchy', null);
    } finally {
        plotLoader.classList.add('hidden');
    }
}
