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

// ─── Универсальный диспетчер шагов ────────────────────────────────────────────

export function drawStep(taskId, method, index, steps, extra) {
    if (index < 0 || index >= steps.length) return;
    switch (taskId) {
        case 'task4': _drawStepTask4(method, index, steps, extra); break;
        case 'task1':
            if (method === 'gauss') _drawStepGauss(index, steps);
            else _drawStepConvergence(index, steps, 'Сходимость метода простой итерации');
            break;
        case 'task2':
            if (method === 'tridiagonal') _drawStepTridiagonal(index, steps);
            else _drawStepConvergence(index, steps, 'Сходимость метода Зейделя');
            break;
        case 'task3': _drawStepJacobi(index, steps); break;
        case 'task5':
            if (method === 'lagrange') _drawStepLagrange(index, steps, extra);
            else _drawStepNewtonInterp(index, steps, extra);
            break;
        case 'task6': _drawStepSpline(index, steps, extra); break;
    }
}

// ─── Task 4 ───────────────────────────────────────────────────────────────────

function _drawStepTask4(method, index, steps, expr) {
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

// ─── Task 1: Метод Гаусса — шаг матрицы ──────────────────────────────────────

function _drawStepGauss(index, steps) {
    const s = steps[index];
    const matrix = s.matrix, vector = s.vector, pivot = s.pivot;
    const phase = s.phase || 'forward';
    const xPartial = s.x || [];
    if (!matrix || matrix.length === 0) return;
    const n = matrix.length;

    const isBackward = phase === 'backward';

    // Цвета строк: ведущая строка подсвечивается по-разному в зависимости от фазы
    const matCellColor = (i) => {
        if (i === pivot) return isBackward ? 'rgba(0,200,100,0.25)' : 'rgba(112,0,255,0.30)';
        return 'rgba(15,20,40,0.90)';
    };
    const vecCellColor = (i) => {
        if (i === pivot) return isBackward ? 'rgba(0,200,100,0.15)' : 'rgba(0,200,220,0.25)';
        return 'rgba(0,18,34,0.90)';
    };
    const matFontColor = (i) => {
        if (i === pivot) return isBackward ? '#4ade80' : '#c084fc';
        return '#d1d5db';
    };
    const vecFontColor = (i) => {
        if (i === pivot) return isBackward ? '#4ade80' : '#67e8f9';
        return '#9ca3af';
    };

    const headerVals = Array.from({ length: n }, (_, j) => `<b>x<sub>${j + 1}</sub></b>`);
    const cellVals   = Array.from({ length: n }, (_, j) => matrix.map(row => row[j].toFixed(4)));
    const fillColors = Array.from({ length: n }, () => Array.from({ length: n }, (_, i) => matCellColor(i)));
    const fontColors = Array.from({ length: n }, () => Array.from({ length: n }, (_, i) => matFontColor(i)));

    // Колонка b
    headerVals.push('<b>b</b>');
    cellVals.push(vector.map(v => v.toFixed(4)));
    fillColors.push(Array.from({ length: n }, (_, i) => vecCellColor(i)));
    fontColors.push(Array.from({ length: n }, (_, i) => vecFontColor(i)));

    // Для обратного хода — добавляем колонку x с частичным решением
    if (isBackward) {
        headerVals.push('<b>x</b>');
        cellVals.push(Array.from({ length: n }, (_, i) =>
            xPartial[i] !== 0 || i >= pivot ? xPartial[i].toFixed(6) : '—'
        ));
        fillColors.push(Array.from({ length: n }, (_, i) => {
            if (i === pivot) return 'rgba(0,200,100,0.30)';
            return xPartial[i] !== 0 || i > pivot ? 'rgba(0,100,50,0.20)' : 'rgba(0,18,34,0.90)';
        }));
        fontColors.push(Array.from({ length: n }, (_, i) => {
            if (i === pivot) return '#4ade80';
            return xPartial[i] !== 0 || i > pivot ? '#86efac' : '#4b5563';
        }));
    }

    // Формула на каждом шаге обратного хода с явными именами переменных
    let formulaAnnotation = null;
    if (isBackward && xPartial.length > 0) {
        // Строка "Используем: x₃ = 0.6429, x₂ = 1.5714"
        const knownParts = [];
        for (let j = pivot + 1; j < n; j++) {
            if (Math.abs(xPartial[j]) > 1e-12 || j > pivot) {
                knownParts.push(`x<sub>${j+1}</sub> = ${xPartial[j].toFixed(4)}`);
            }
        }
        const knownLine = knownParts.length > 0 ? `Известны: ${knownParts.join(', ')}<br>` : '';

        // Строка формулы: x₁ = (b₁ − a₁₂·x₂ − a₁₃·x₃) / a₁₁ = result
        let formulaParts = `${vector[pivot].toFixed(4)}`;
        for (let j = pivot + 1; j < n; j++) {
            const a_ij = matrix[pivot][j];
            if (Math.abs(a_ij) > 1e-12) {
                formulaParts += ` − (${a_ij.toFixed(4)})·x<sub>${j+1}</sub>`;
            }
        }
        const a_ii = matrix[pivot][pivot].toFixed(4);
        const formulaLine = `x<sub>${pivot+1}</sub> = ( ${formulaParts} ) / ${a_ii} = <b>${xPartial[pivot].toFixed(6)}</b>`;

        const hasTwoLines = knownLine.length > 0;
        formulaAnnotation = {
            x: 0.5, y: hasTwoLines ? -0.07 : -0.04,
            xref: 'paper', yref: 'paper',
            text: knownLine + formulaLine,
            showarrow: false,
            font: { color: '#a3e635', size: 12, family: 'monospace' },
            align: 'center',
        };
    }

    const phaseLabel = isBackward
        ? `Обратный ход — вычисляем x<sub>${pivot + 1}</sub>`
        : `Прямой ход — шаг ${index + 1}, ведущая строка ${pivot + 1}`;

    Plotly.react('plot', [{
        type: 'table',
        header: {
            values: headerVals, align: 'center',
            fill: { color: '#0d1120' },
            font: { color: '#6b7280', size: 11, family: 'Inter, sans-serif' },
            line: { color: 'rgba(255,255,255,0.08)', width: 1 }, height: 28,
        },
        cells: {
            values: cellVals, align: 'center',
            fill: { color: fillColors },
            font: { color: fontColors, size: 12, family: 'monospace' },
            line: { color: 'rgba(255,255,255,0.06)', width: 1 }, height: 32,
        },
    }], {
        ...baseLayout,
        title: { text: phaseLabel, font: { color: '#9ca3af', size: 12 } },
        margin: { t: 50, r: 20, b: isBackward ? 72 : 10, l: 20 },
        annotations: formulaAnnotation ? [formulaAnnotation] : [],
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 1/2: Сходимость итерационных методов (растущий график) ──────────────

function _drawStepConvergence(index, steps, title) {
    const s = steps[index];
    const norms = steps.slice(0, index + 1).map(s => s.norm);
    const iters = Array.from({ length: norms.length }, (_, i) => i + 1);
    Plotly.react('plot', [{
        x: iters, y: norms,
        type: 'scatter', mode: 'lines+markers',
        line: { color: '#00f0ff', width: 2 },
        marker: { color: iters.map((_, i) => i === index ? '#ff3366' : '#00f0ff'), size: iters.map((_, i) => i === index ? 9 : 5) },
        name: 'Погрешность',
    }], {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, title: 'Итерация' },
        yaxis: { ...baseLayout.yaxis, title: 'Норма ||x^(k+1) - x^(k)||', type: 'log' },
        title: { text: `${title} | итерация ${index + 1}, норма = ${norms[index].toExponential(3)}`, font: { color: '#9ca3af', size: 12 } },
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 2: Метод прогонки — шаг прямого/обратного хода ─────────────────────

function _drawStepTridiagonal(index, steps) {
    const s = steps[index];
    const alpha = s.alpha || [];
    const beta  = s.beta  || [];
    const x     = s.x    || [];
    const phase = s.phase || 'forward';
    const n = Math.max(alpha.length, beta.length);
    const cur = s.index ?? index;
    const indices = Array.from({ length: n }, (_, i) => i + 1);
    const isBackward = phase === 'backward';

    if (isBackward) {
        const colors = indices.map((_, i) => {
            if (i === cur) return '#ff3366';
            return x[i] !== 0 || i > cur ? '#4ade80' : 'rgba(0,200,100,0.15)';
        });

        // Каждый шаг — формула с явными значениями переменных
        let knownLine = '';
        if (cur < n - 1 && Math.abs(x[cur + 1]) > 1e-12) {
            knownLine = `Известно: x<sub>${cur+2}</sub> = ${x[cur+1].toFixed(4)}<br>`;
        }
        let formulaText;
        if (cur < n - 1) {
            formulaText = knownLine
                + `x<sub>${cur+1}</sub> = α<sub>${cur+1}</sub>·x<sub>${cur+2}</sub> + β<sub>${cur+1}</sub>`
                + ` = ${alpha[cur].toFixed(4)}·x<sub>${cur+2}</sub> + ${beta[cur].toFixed(4)}`
                + ` = ${alpha[cur].toFixed(4)}·${x[cur+1].toFixed(4)} + ${beta[cur].toFixed(4)}`
                + ` = <b>${x[cur].toFixed(6)}</b>`;
        } else {
            formulaText = `x<sub>${cur+1}</sub> = β<sub>${cur+1}</sub> = <b>${x[cur].toFixed(6)}</b>`;
        }

        Plotly.react('plot', [{
            x: indices, y: x.map(v => v || 0),
            type: 'bar', name: 'x',
            marker: { color: colors },
            text: x.map((v, i) => (v !== 0 || i >= cur) ? v.toFixed(4) : ''),
            textposition: 'outside',
            textfont: { color: '#9ca3af', size: 10 },
        }], {
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Индекс' },
            yaxis: { ...baseLayout.yaxis, title: 'x' },
            title: { text: `Обратный ход прогонки — x<sub>${cur+1}</sub>`, font: { color: '#9ca3af', size: 12 } },
            margin: { t: 50, r: 20, b: 72, l: 40 },
            annotations: [{
                x: 0.5, y: knownLine.length > 0 ? -0.07 : -0.04,
                xref: 'paper', yref: 'paper',
                text: formulaText, showarrow: false,
                font: { color: '#a3e635', size: 12, family: 'monospace' }, align: 'center',
            }],
        }, { responsive: true, displayModeBar: false });
        return;
    }

    // Прямой ход: bar chart α/β
    const alphaColors = indices.map((_, i) => i <= cur ? (i === cur ? '#ff3366' : '#00f0ff') : 'rgba(0,240,255,0.15)');
    const betaColors  = indices.map((_, i) => i <= cur ? (i === cur ? '#ff9900' : '#7000ff') : 'rgba(112,0,255,0.15)');

    Plotly.react('plot', [
        { x: indices, y: alpha, type: 'bar', name: 'α', marker: { color: alphaColors } },
        { x: indices, y: beta,  type: 'bar', name: 'β', marker: { color: betaColors  } },
    ], {
        ...baseLayout,
        barmode: 'group',
        xaxis: { ...baseLayout.xaxis, title: 'Индекс' },
        yaxis: { ...baseLayout.yaxis, title: 'Значение' },
        title: { text: `Прямой ход прогонки — шаг ${index + 1} | α[${cur+1}] = ${(alpha[cur]??0).toFixed(4)}, β[${cur+1}] = ${(beta[cur]??0).toFixed(4)}`, font: { color: '#9ca3af', size: 12 } },
        showlegend: true,
        legend: { font: { color: '#9ca3af' }, bgcolor: 'rgba(0,0,0,0)' },
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 3: Метод Якоби — шаг вращения / извлечение λ ───────────────────────

function _drawStepJacobi(index, steps) {
    const s = steps[index];
    const matrix = s.matrix;
    if (!matrix || matrix.length === 0) return;
    const n = matrix.length;
    const p = s.p ?? s.P;
    const q = s.q ?? s.Q;
    const phase = s.phase || 'rotation';

    // Финальный шаг: извлечение собственных значений с диагонали
    if (phase === 'extract') {
        const eigenvalues = Array.from({ length: n }, (_, i) => matrix[i][i]);
        const labels = eigenvalues.map((_, i) => `λ<sub>${i + 1}</sub>`);
        Plotly.react('plot', [{
            x: labels, y: eigenvalues,
            type: 'bar',
            marker: { color: eigenvalues.map(() => '#c084fc'), opacity: 0.9 },
            text: eigenvalues.map(v => v.toFixed(6)),
            textposition: 'outside',
            textfont: { color: '#9ca3af', size: 11 },
        }], {
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Собственное значение' },
            yaxis: { ...baseLayout.yaxis, title: 'Значение' },
            title: { text: `Извлечение λ с диагонали: ${eigenvalues.map((v, i) => `λ${i+1} = ${v.toFixed(4)}`).join(', ')}`, font: { color: '#c084fc', size: 12 } },
            annotations: [{
                x: 0.5, y: -0.06, xref: 'paper', yref: 'paper',
                text: eigenvalues.map((v, i) => `<b>λ<sub>${i+1}</sub> = ${v.toFixed(6)}</b>`).join('   '),
                showarrow: false,
                font: { color: '#a3e635', size: 13, family: 'monospace' }, align: 'center',
            }],
            margin: { t: 50, r: 20, b: 48, l: 40 },
        }, { responsive: true, displayModeBar: false });
        return;
    }

    // Шаг вращения
    const fillColors = Array.from({ length: n }, (_, j) =>
        Array.from({ length: n }, (_, i) => {
            if ((i === p && j === q) || (i === q && j === p)) return 'rgba(255,51,102,0.40)';
            if (i === j) return 'rgba(112,0,255,0.20)';
            return 'rgba(15,20,40,0.90)';
        })
    );
    const fontColors = Array.from({ length: n }, (_, j) =>
        Array.from({ length: n }, (_, i) =>
            ((i === p && j === q) || (i === q && j === p)) ? '#ff3366' : i === j ? '#c084fc' : '#d1d5db'
        )
    );

    const headerVals = Array.from({ length: n }, (_, j) => `<b>${j + 1}</b>`);
    const cellVals = Array.from({ length: n }, (_, j) => matrix.map(row => row[j].toFixed(4)));

    Plotly.react('plot', [{
        type: 'table',
        header: {
            values: headerVals, align: 'center',
            fill: { color: '#0d1120' },
            font: { color: '#6b7280', size: 11, family: 'Inter, sans-serif' },
            line: { color: 'rgba(255,255,255,0.08)', width: 1 }, height: 28,
        },
        cells: {
            values: cellVals, align: 'center',
            fill: { color: fillColors },
            font: { color: fontColors, size: 12, family: 'monospace' },
            line: { color: 'rgba(255,255,255,0.06)', width: 1 }, height: 32,
        },
    }], {
        ...baseLayout,
        title: { text: `Якоби — шаг ${index + 1} | обнуляем (${p + 1},${q + 1}) | норма = ${(s.norm ?? 0).toExponential(3)}`, font: { color: '#9ca3af', size: 12 } },
        margin: { t: 50, r: 20, b: 10, l: 20 },
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 5: Лагранж — накапливающийся многочлен ─────────────────────────────

function _lagrangeBasis(xNodes, i, t) {
    let basis = 1;
    for (let j = 0; j < xNodes.length; j++) {
        if (j !== i) basis *= (t - xNodes[j]) / (xNodes[i] - xNodes[j]);
    }
    return basis;
}

function _evalLagrangePartial(xNodes, yNodes, upToIndex, tArr) {
    return tArr.map(t => {
        let sum = 0;
        for (let i = 0; i <= upToIndex; i++) {
            sum += yNodes[i] * _lagrangeBasis(xNodes, i, t);
        }
        return sum;
    });
}

function _drawStepLagrange(index, steps, extra) {
    if (!extra) return;
    const { x, y, xs, curveX, value } = extra;
    const partialY = _evalLagrangePartial(x, y, index, curveX);
    const partialXs = _evalLagrangePartial(x, y, index, [xs])[0];

    const s = steps[index];
    const termAccum = steps.slice(0, index + 1).reduce((acc, st) => acc + (st.term ?? 0), 0);

    Plotly.react('plot', [
        {
            x: curveX, y: partialY,
            type: 'scatter', mode: 'lines', name: `P${index}(x)`,
            line: { color: '#00f0ff', width: 3 },
        },
        {
            x: x, y: y,
            type: 'scatter', mode: 'markers', name: 'Узлы',
            marker: { color: x.map((_, i) => i <= index ? '#7000ff' : 'rgba(112,0,255,0.25)'), size: 8 },
        },
        {
            x: [xs], y: [partialXs],
            type: 'scatter', mode: 'markers', name: `P(${xs})`,
            marker: { color: '#ff3366', size: 12, symbol: 'star' },
        },
    ], {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, title: 'x' },
        yaxis: { ...baseLayout.yaxis, title: 'y' },
        title: { text: `Лагранж — базис L${index}(x), P${index}(${xs}) ≈ ${termAccum.toFixed(6)}`, font: { color: '#9ca3af', size: 12 } },
        showlegend: true,
        legend: { font: { color: '#9ca3af' }, bgcolor: 'rgba(0,0,0,0)' },
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 5: Ньютон — накапливающийся многочлен ───────────────────────────────

function _evalNewtonPartial(xNodes, ddCoeffs, upToOrder, tArr) {
    return tArr.map(t => {
        let sum = ddCoeffs[0];
        let product = 1;
        for (let k = 1; k <= upToOrder; k++) {
            product *= (t - xNodes[k - 1]);
            sum += ddCoeffs[k] * product;
        }
        return sum;
    });
}

function _drawStepNewtonInterp(index, steps, extra) {
    if (!extra) return;
    const { x, y, xs, curveX } = extra;
    const ddCoeffs = steps.map(s => (s.values && s.values[0] !== undefined) ? s.values[0] : 0);
    const partialY = _evalNewtonPartial(x, ddCoeffs, index, curveX);
    const partialXs = _evalNewtonPartial(x, ddCoeffs, index, [xs])[0];

    Plotly.react('plot', [
        {
            x: curveX, y: partialY,
            type: 'scatter', mode: 'lines', name: `P${index}(x)`,
            line: { color: '#00f0ff', width: 3 },
        },
        {
            x: x, y: y,
            type: 'scatter', mode: 'markers', name: 'Узлы',
            marker: { color: x.map((_, i) => i <= index ? '#7000ff' : 'rgba(112,0,255,0.25)'), size: 8 },
        },
        {
            x: [xs], y: [partialXs],
            type: 'scatter', mode: 'markers', name: `P(${xs})`,
            marker: { color: '#ff3366', size: 12, symbol: 'star' },
        },
    ], {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, title: 'x' },
        yaxis: { ...baseLayout.yaxis, title: 'y' },
        title: { text: `Ньютон — ${index + 1}-й порядок, P${index}(${xs}) ≈ ${partialXs.toFixed(6)}`, font: { color: '#9ca3af', size: 12 } },
        showlegend: true,
        legend: { font: { color: '#9ca3af' }, bgcolor: 'rgba(0,0,0,0)' },
    }, { responsive: true, displayModeBar: false });
}

// ─── Task 6: Кубический сплайн — сегмент за сегментом ────────────────────────

function _drawStepSpline(index, steps, extra) {
    if (!extra) return;
    const { x, y, curveX, curveY } = extra;
    const seg = steps[index];

    // Показать кривую только до правой границы текущего сегмента
    const xRight = seg.x_right ?? (x[index + 1] ?? curveX[curveX.length - 1]);
    const mask = curveX.map(xi => xi <= xRight + 1e-9);
    const visX = curveX.filter((_, i) => mask[i]);
    const visY = curveY.filter((_, i) => mask[i]);

    // Подсветить текущий сегмент
    const hx = [], hy = [];
    const npts = 60;
    for (let i = 0; i < npts; i++) {
        const t = seg.x_left + (seg.x_right - seg.x_left) * i / (npts - 1);
        const dx = t - seg.x_left;
        hx.push(t);
        hy.push(seg.a + seg.b * dx + seg.c * dx * dx + seg.d * dx * dx * dx);
    }

    Plotly.react('plot', [
        {
            x: visX, y: visY,
            type: 'scatter', mode: 'lines', name: 'Сплайн',
            line: { color: 'rgba(0,240,255,0.4)', width: 2 },
        },
        {
            x: hx, y: hy,
            type: 'scatter', mode: 'lines', name: `S${index}`,
            line: { color: '#00f0ff', width: 4 },
        },
        {
            x: x, y: y,
            type: 'scatter', mode: 'markers', name: 'Узлы',
            marker: { color: '#7000ff', size: 8 },
        },
    ], {
        ...baseLayout,
        xaxis: { ...baseLayout.xaxis, title: 'x' },
        yaxis: { ...baseLayout.yaxis, title: 'y' },
        title: {
            text: `Сплайн — сегмент ${index + 1}/${steps.length} | [${seg.x_left.toFixed(3)}, ${seg.x_right.toFixed(3)}] | a=${seg.a.toFixed(4)} b=${seg.b.toFixed(4)} c=${seg.c.toFixed(4)} d=${seg.d.toFixed(4)}`,
            font: { color: '#9ca3af', size: 11 }
        },
        showlegend: true,
        legend: { font: { color: '#9ca3af' }, bgcolor: 'rgba(0,0,0,0)' },
    }, { responsive: true, displayModeBar: false });
}

// ─── Статичные функции (используются при финальном отображении) ───────────────

export function drawMatrixHeatmap(matrix, vector, pivotRow) {
    if (!matrix || matrix.length === 0) return;
    const n = matrix.length;

    const matrixCellColor = (i) =>
        i === pivotRow ? 'rgba(112, 0, 255, 0.30)' : 'rgba(15, 20, 40, 0.90)';
    const vectorCellColor = (i) =>
        i === pivotRow ? 'rgba(0, 200, 220, 0.25)' : 'rgba(0, 18, 34, 0.90)';

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
