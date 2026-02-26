import { evaluateMathStr } from './math_util.js';

let currentBaseTrace = null;
let currentXRange = [-10, 10];
let currentYRange = [-10, 10];

const layoutTemplate = {
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
    }], layoutTemplate, { responsive: true, displayModeBar: false, scrollZoom: true });

    // Слушаем события зума от пользователя, чтобы при включении новых шагов
    // график оставался в пределах выбранного зума.
    document.getElementById('plot').on('plotly_relayout', (e) => {
        if (e['xaxis.range[0]'] !== undefined) {
            currentXRange = [e['xaxis.range[0]'], e['xaxis.range[1]']];
            currentYRange = [e['yaxis.range[0]'], e['yaxis.range[1]']];
        } else if (e['xaxis.autorange']) {
            // Если двойной клик (сброс)
            const graphDiv = document.getElementById('plot');
            if (graphDiv.layout.xaxis && graphDiv.layout.xaxis.range) {
                currentXRange = graphDiv.layout.xaxis.range;
                currentYRange = graphDiv.layout.yaxis.range;
            }
        }
    });
}

export function drawBaseGraph(expr, center, span = 10) {
    const a = center - span;
    const b = center + span;
    
    const xVals = [];
    const yVals = [];
    const step = (b - a) / 500;
    
    let minY = Infinity;
    let maxY = -Infinity;

    for (let x = a; x <= b; x += step) {
        let y = evaluateMathStr(expr, x);
        if (y !== null && !isNaN(y) && Math.abs(y) < 100000) {
            xVals.push(x);
            yVals.push(y);
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    
    currentXRange = [a, b];
    const yPadding = Math.max(0.1, (maxY - minY) * 0.1);
    currentYRange = [(minY === Infinity ? -10 : minY - yPadding), (maxY === -Infinity ? 10 : maxY + yPadding)];

    currentBaseTrace = {
        x: xVals,
        y: yVals,
        type: 'scatter',
        mode: 'lines',
        name: 'f(x)',
        line: { color: '#00f0ff', width: 3, shape: 'spline' }
    };

    const layout = {
        ...layoutTemplate,
        xaxis: { ...layoutTemplate.xaxis, range: currentXRange },
        yaxis: { ...layoutTemplate.yaxis, range: currentYRange }
    };

    Plotly.react('plot', [currentBaseTrace], layout);
}

export function drawStep(index, steps, method, expr) {
    if (index < 0 || index >= steps.length) return;
    
    const stepData = steps[index];
    let stepTraces = [];
    
    if (method === 'dichotomy') {
        const a = stepData.a !== undefined ? stepData.a : stepData.A;
        const b = stepData.b !== undefined ? stepData.b : stepData.B;
        const c = stepData.c !== undefined ? stepData.c : stepData.C;

        stepTraces.push({
            x: [a, a], y: [currentYRange[0], currentYRange[1]], 
            mode: 'lines', name: 'a', line: { color: '#ff3366', width: 2, dash: 'dash' }
        });
        stepTraces.push({
            x: [b, b], y: [currentYRange[0], currentYRange[1]], 
            mode: 'lines', name: 'b', line: { color: '#ff3366', width: 2, dash: 'dash' }
        });
        stepTraces.push({
            x: [c], y: [0], 
            mode: 'markers', name: 'c (mid)', marker: { color: '#00f0ff', size: 10, symbol: 'circle-dot' }
        });
    } else if (method === 'newton') {
        const x_p = stepData.x_prev !== undefined ? stepData.x_prev : stepData.XPrev;
        const fx = stepData.fx !== undefined ? stepData.fx : stepData.Fx;
        const x_n = stepData.x_new !== undefined ? stepData.x_new : stepData.XNew;
        
        stepTraces.push({
            x: [x_p, x_n], y: [fx, 0], 
            mode: 'lines', name: 'Tangent', line: { color: '#7000ff', width: 2 }
        });
        stepTraces.push({
            x: [x_p, x_n], y: [fx, 0], 
            mode: 'markers', name: 'Points', marker: { color: ['#ffffff', '#00f0ff'], size: 8 }
        });
        stepTraces.push({
            x: [x_n, x_n], y: [0, evaluateMathStr(expr, x_n)], 
            mode: 'lines', name: 'Projection', line: { color: 'rgba(255,255,255,0.3)', width: 1, dash: 'dot' }
        });
    } else if (method === 'simple_iter') {
        const x_p = stepData.x_prev !== undefined ? stepData.x_prev : stepData.XPrev;
        const x_n = stepData.x_new !== undefined ? stepData.x_new : stepData.XNew;
        let fx = stepData.fx !== undefined ? stepData.fx : stepData.Fx;
        if (fx === undefined) fx = evaluateMathStr(expr, x_p);
        
        stepTraces.push({
            x: [x_p, x_n], y: [fx, evaluateMathStr(expr, x_n)], 
            mode: 'lines', name: 'Iteration path', line: { color: '#7000ff', width: 2, dash: 'dot' }
        });
        stepTraces.push({
            x: [x_p, x_n], y: [fx, evaluateMathStr(expr, x_n)], 
            mode: 'markers', name: 'Points', marker: { color: ['#ffffff', '#00f0ff'], size: 8 }
        });
    }
    
    // Rigidly Fix Layout X and Y ranges so plot doesn't zoom
    const layout = {
        ...layoutTemplate,
        xaxis: { ...layoutTemplate.xaxis, range: currentXRange },
        yaxis: { ...layoutTemplate.yaxis, range: currentYRange }
    };

    Plotly.react('plot', [currentBaseTrace, ...stepTraces], layout);
}
