import { evaluateMathStr } from './math_util.js';

let currentBaseTrace = null;
let currentXRange = [-10, 10];
let currentYRange = [-10, 10];

const baseLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif', color: '#9ca3af' },
    margin: { t: 40, r: 20, b: 40, l: 40 },
    xaxis: {
        gridcolor: 'rgba(255,255,255,0.05)',
        zerolinecolor: 'rgba(255,255,255,0.2)',
        zerolinewidth: 2,
    },
    yaxis: {
        gridcolor: 'rgba(255,255,255,0.05)',
        zerolinecolor: 'rgba(255,255,255,0.2)',
        zerolinewidth: 2,
    },
    showlegend: false,
    hovermode: 'closest',
    dragmode: 'pan'
};

export function initPlot() {
    Plotly.newPlot('plot', [{
        x: [], y: [], type: 'scatter', mode: 'lines',
        line: { color: '#00f0ff', width: 3, shape: 'spline' }
    }], baseLayout, { responsive: true, displayModeBar: false, scrollZoom: true });

    document.getElementById('plot').on('plotly_relayout', (e) => {
        if (e['xaxis.range[0]'] !== undefined) {
            currentXRange = [e['xaxis.range[0]'], e['xaxis.range[1]']];
            currentYRange = [e['yaxis.range[0]'], e['yaxis.range[1]']];
        }
    });
}

// ─── Task 4: Нелинейное уравнение ─────────────────────────────────────────────

export function drawBaseGraph(expr, center, span = 10) {
    const a = center - span;
    const b = center + span;
    const step = (b - a) / 500;
    const xVals = [], yVals = [];
    let minY = Infinity, maxY = -Infinity;

    for (let x = a; x <= b; x += step) {
        const y = evaluateMathStr(expr, x);
        if (y !== null && !isNaN(y) && Math.abs(y) < 100000) {
            xVals.push(x); yVals.push(y);
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    currentXRange = [a, b];
    const yPad = Math.max(0.1, (maxY - minY) * 0.1);
    currentYRange = [
        minY === Infinity ? -10 : minY - yPad,
        maxY === -Infinity ? 10 : maxY + yPad
    ];

    currentBaseTrace = {
        x: xVals, y: yVals, type: 'scatter', mode: 'lines', name: 'f(x)',
        line: { color: '#00f0ff', width: 3, shape: 'spline' }
    };

    Plotly.react('plot', [currentBaseTrace], {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, range: currentXRange },
        yaxis: { ...baseLayout.yaxis, range: currentYRange }
    });
}

export function drawStep(index, steps, method, expr) {
    if (index < 0 || index >= steps.length) return;
    const s = steps[index];
    const traces = [];

    if (method === 'dichotomy') {
        const a = s.a ?? s.A, b = s.b ?? s.B, c = s.c ?? s.C ?? (a + b) / 2;
        traces.push({ x: [a, a], y: currentYRange, mode: 'lines', name: 'a', line: { color: '#ff3366', width: 2, dash: 'dash' } });
        traces.push({ x: [b, b], y: currentYRange, mode: 'lines', name: 'b', line: { color: '#ff3366', width: 2, dash: 'dash' } });
        traces.push({ x: [c], y: [0], mode: 'markers', name: 'mid', marker: { color: '#00f0ff', size: 10 } });
    } else if (method === 'newton') {
        const xp = s.x_prev ?? s.XPrev, xn = s.x_new ?? s.XNew, fx = s.fx ?? s.Fx;
        traces.push({ x: [xp, xn], y: [fx, 0], mode: 'lines', line: { color: '#7000ff', width: 2 } });
        traces.push({ x: [xp, xn], y: [fx, 0], mode: 'markers', marker: { color: ['#ffffff', '#00f0ff'], size: 8 } });
        traces.push({ x: [xn, xn], y: [0, evaluateMathStr(expr, xn)], mode: 'lines', line: { color: 'rgba(255,255,255,0.3)', width: 1, dash: 'dot' } });
    } else if (method === 'simple_iter') {
        const xp = s.x_prev ?? s.XPrev, xn = s.x_new ?? s.XNew;
        const fx = s.fx ?? s.Fx ?? evaluateMathStr(expr, xp);
        traces.push({ x: [xp, xn], y: [fx, evaluateMathStr(expr, xn)], mode: 'lines', line: { color: '#7000ff', width: 2, dash: 'dot' } });
        traces.push({ x: [xp, xn], y: [fx, evaluateMathStr(expr, xn)], mode: 'markers', marker: { color: ['#ffffff', '#00f0ff'], size: 8 } });
    }

    Plotly.react('plot', [currentBaseTrace, ...traces], {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, range: currentXRange },
        yaxis: { ...baseLayout.yaxis, range: currentYRange }
    });
}

// ─── Tasks 1–3: Матричные методы ─────────────────────────────────────────────

export function drawMatrixHeatmap(matrix, vector, pivotRow) {
    if (!matrix || matrix.length === 0) return;
    const n = matrix.length;

    const matrixCellColor = (i) =>
        i === pivotRow ? 'rgba(112, 0, 255, 0.30)' : 'rgba(15, 20, 40, 0.90)';
    const vectorCellColor = (i) =>
        i === pivotRow ? 'rgba(0, 200, 220, 0.25)' : 'rgba(0, 18, 34, 0.90)';

    // Plotly table is column-major: values[j] = column j values for all rows
    const headerVals = Array.from({ length: n }, (_, j) => `<b>x<sub>${j + 1}</sub></b>`);
    const cellVals   = Array.from({ length: n }, (_, j) =>
        matrix.map(row => row[j].toFixed(4))
    );
    const fillColors = Array.from({ length: n }, () =>
        Array.from({ length: n }, (_, i) => matrixCellColor(i))
    );
    const fontColors = Array.from({ length: n }, () =>
        Array.from({ length: n }, (_, i) => i === pivotRow ? '#c084fc' : '#d1d5db')
    );

    if (vector) {
        headerVals.push('<b>b</b>');
        cellVals.push(vector.map(v => v.toFixed(4)));
        fillColors.push(Array.from({ length: n }, (_, i) => vectorCellColor(i)));
        fontColors.push(Array.from({ length: n }, (_, i) => i === pivotRow ? '#67e8f9' : '#9ca3af'));
    }

    const trace = {
        type: 'table',
        header: {
            values: headerVals,
            align: 'center',
            fill: { color: '#0d1120' },
            font: { color: '#6b7280', size: 11, family: 'Inter, sans-serif' },
            line: { color: 'rgba(255,255,255,0.08)', width: 1 },
            height: 28,
        },
        cells: {
            values: cellVals,
            align: 'center',
            fill: { color: fillColors },
            font: { color: fontColors, size: 12, family: 'monospace' },
            line: { color: 'rgba(255,255,255,0.06)', width: 1 },
            height: 32,
        },
    };

    Plotly.react('plot', [trace], {
        ...baseLayout,
        title: { text: 'Состояние матрицы', font: { color: '#9ca3af', size: 13 } },
        margin: { t: 50, r: 20, b: 10, l: 20 },
    }, { responsive: true, displayModeBar: false });
}

export function drawConvergence(norms, title = 'Сходимость (норма погрешности)', color = '#00f0ff') {
    const iters = Array.from({ length: norms.length }, (_, i) => i + 1);
    Plotly.react('plot', [{
        x: iters, y: norms,
        type: 'scatter', mode: 'lines+markers',
        line: { color, width: 2 },
        marker: { color, size: 5 },
        name: 'Погрешность',
    }], {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, title: 'Итерация' },
        yaxis: { ...baseLayout.yaxis, title: 'Норма ||x^(k+1) - x^(k)||', type: 'log' },
        title: { text: title, font: { color: '#9ca3af', size: 13 } },
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 5: Интерполяция ─────────────────────────────────────────────────────

export function drawInterpolation(xNodes, yNodes, curveX, curveY, xs, value) {
    const traces = [
        {
            x: curveX, y: curveY,
            type: 'scatter', mode: 'lines', name: 'Многочлен',
            line: { color: '#00f0ff', width: 3 }
        },
        {
            x: xNodes, y: yNodes,
            type: 'scatter', mode: 'markers', name: 'Узлы',
            marker: { color: '#7000ff', size: 8, symbol: 'circle' }
        },
        {
            x: [xs], y: [value],
            type: 'scatter', mode: 'markers', name: `P(${xs})`,
            marker: { color: '#ff3366', size: 12, symbol: 'star' }
        }
    ];

    Plotly.react('plot', traces, {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, title: 'x' },
        yaxis: { ...baseLayout.yaxis, title: 'y' },
        title: { text: 'Интерполяционный многочлен', font: { color: '#9ca3af', size: 13 } },
        showlegend: true,
        legend: { font: { color: '#9ca3af' }, bgcolor: 'rgba(0,0,0,0)' },
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 6: Кубический сплайн ────────────────────────────────────────────────

export function drawSpline(xNodes, yNodes, curveX, curveY, highlightSeg, segments) {
    const traces = [
        {
            x: curveX, y: curveY,
            type: 'scatter', mode: 'lines', name: 'Сплайн',
            line: { color: '#00f0ff', width: 3 }
        },
        {
            x: xNodes, y: yNodes,
            type: 'scatter', mode: 'markers', name: 'Узлы',
            marker: { color: '#7000ff', size: 8 }
        }
    ];

    // Подсветить текущий отрезок
    if (segments && segments[highlightSeg]) {
        const s = segments[highlightSeg];
        const npts = 60;
        const hx = [], hy = [];
        for (let i = 0; i < npts; i++) {
            const t = s.x_left + (s.x_right - s.x_left) * i / (npts - 1);
            const dx = t - s.x_left;
            hx.push(t);
            hy.push(s.a + s.b * dx + s.c * dx * dx + s.d * dx * dx * dx);
        }
        traces.push({
            x: hx, y: hy,
            type: 'scatter', mode: 'lines', name: `S${highlightSeg}`,
            line: { color: '#ff3366', width: 4 }
        });
    }

    Plotly.react('plot', traces, {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, title: 'x' },
        yaxis: { ...baseLayout.yaxis, title: 'y' },
        title: { text: 'Кубический сплайн дефекта 1', font: { color: '#9ca3af', size: 13 } },
        showlegend: true,
        legend: { font: { color: '#9ca3af' }, bgcolor: 'rgba(0,0,0,0)' },
    }, { responsive: true, displayModeBar: false });
}
