import { calculateMethod } from '../api.js';

export function init() {
    document.getElementById('precision-slider-task9')?.addEventListener('input', e => {
        const el = document.getElementById('precision-value-task9');
        if (el) el.textContent = `1e-${e.target.value}`;
    });
}

export async function calculate(plotLoader, onSteps) {
    const formula  = document.getElementById('formula-task9')?.value?.trim();
    const a        = parseFloat(document.getElementById('a-task9')?.value);
    const b        = parseFloat(document.getElementById('b-task9')?.value);
    const epsPow   = parseInt(document.getElementById('precision-slider-task9')?.value ?? '4');
    const epsilon  = Math.pow(10, -epsPow);

    if (!formula) { alert('Введите функцию f(x)'); return; }
    if (isNaN(a) || isNaN(b) || a >= b) { alert('Введите корректные пределы a < b'); return; }

    plotLoader.classList.remove('hidden');
    try {
        const data = await calculateMethod('task9', 'simpson', { formula, a, b, epsilon });

        // Результат
        const resBox   = document.getElementById('results-task9');
        const integEl  = document.getElementById('integral-task9');
        const iterEl   = document.getElementById('iter-task9');
        if (resBox && integEl) {
            integEl.textContent = data.integral?.toFixed(8) ?? '—';
            if (iterEl) iterEl.textContent = data.steps?.length ?? 0;
            resBox.classList.remove('hidden');
        }

        const extra = {
            curveX: data.curve_x,
            curveY: data.curve_y,
            segX:   data.seg_x,
            segY:   data.seg_y,
        };

        onSteps(data.steps, 'simpson', extra);
    } finally {
        plotLoader.classList.add('hidden');
    }
}
