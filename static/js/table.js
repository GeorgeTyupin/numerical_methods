/**
 * table.js — универсальная итерационная таблица шагов.
 * Отображает историю всех шагов под графиком, текущий шаг подсвечен.
 */

const container = () => document.getElementById('step-table-container');
const thead     = () => document.getElementById('step-table-head');
const tbody     = () => document.getElementById('step-table-body');

export function setTableVisible(visible) {
    const el = container();
    if (!el) return;
    const wasHidden = el.classList.contains('hidden');
    const changed = wasHidden !== !visible;
    el.classList.toggle('hidden', !visible);
    // Plotly нужно сообщить о новом размере контейнера после того,
    // как браузер перестроил flex-layout
    if (changed) {
        // Plotly с responsive:true слушает window resize — диспатчим его после relayout
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });
    }
}

export function clearTable() {
    const th = thead(), tb = tbody();
    if (th) th.innerHTML = '';
    if (tb) tb.innerHTML = '';
    setTableVisible(false);
}

/** Форматирует число для отображения в таблице */
function fmt(v, digits = 6) {
    if (v === undefined || v === null) return '—';
    const n = Number(v);
    if (!isFinite(n)) return String(v);
    if (Math.abs(n) < 1e-4 && n !== 0) return n.toExponential(3);
    return n.toFixed(digits);
}

/**
 * Возвращает { headers: string[], rows: (string[])[] } для заданного метода.
 * extra передаётся для методов, которым нужны дополнительные данные (формула, точки).
 */
function buildTableData(taskId, method, stepIndex, steps, extra) {
    // Видимые шаги — от 0 до stepIndex включительно
    const visible = steps.slice(0, stepIndex + 1);
    const current = steps[stepIndex]; // ← правильный текущий шаг
    const key = `${taskId}:${method}`;
    switch (key) {

        // ── Задание 1: Гаусс ──────────────────────────────────────────────────
        case 'task1:gauss': {
            const headers = ['k', 'Вед. строка', 'Фаза'];
            const rows = visible.map((s, i) => [i + 1, s.pivot + 1, s.phase === 'forward' ? 'прямой' : 'обратный']);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 1: Простая итерация (СЛАУ) ────────────────────────────────
        case 'task1:simple_iter': {
            const n = steps[0]?.x?.length ?? 0;
            const headers = ['k', ...Array.from({ length: n }, (_, i) => `x${i + 1}`), '‖e‖'];
            const rows = visible.map((s, i) => [
                i + 1,
                ...Array.from({ length: n }, (_, j) => fmt(s.x?.[j])),
                fmt(s.norm)
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 2: Прогонка ────────────────────────────────────────────────
        case 'task2:tridiagonal': {
            const phase = current?.phase;
            if (phase === 'forward') {
                const fwdSteps = visible.filter(s => s.phase === 'forward');
                const headers = ['k', 'αk', 'βk'];
                const rows = fwdSteps.map((s, i) => [
                    i,
                    fmt(s.alpha?.[s.index]),
                    fmt(s.beta?.[s.index])
                ]);
                return { headers, rows, activeRow: rows.length - 1 };
            } else {
                const bwdSteps = visible.filter(s => s.phase === 'backward');
                const headers = ['k', 'xk'];
                const rows = bwdSteps.map(s => [
                    s.index,
                    fmt(s.x?.[s.index])
                ]);
                return { headers, rows, activeRow: rows.length - 1 };
            }
        }

        // ── Задание 2: Зейдель ────────────────────────────────────────────────
        case 'task2:seidel': {
            const n = steps[0]?.x?.length ?? 0;
            const headers = ['k', ...Array.from({ length: n }, (_, i) => `x${i + 1}`), '‖e‖'];
            const rows = visible.map((s, i) => [
                i + 1,
                ...Array.from({ length: n }, (_, j) => fmt(s.x?.[j])),
                fmt(s.norm)
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 3: Якоби ──────────────────────────────────────────────────
        case 'task3:jacobi': {
            const headers = ['k', 'p', 'q', 'norm', 'Фаза'];
            const rows = visible.map((s, i) => [
                i + 1,
                s.p !== undefined ? s.p + 1 : '—',
                s.q !== undefined ? s.q + 1 : '—',
                fmt(s.norm),
                s.phase === 'rotation' ? 'вращение' : 'результат'
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 4: Дихотомия ──────────────────────────────────────────────
        case 'task4:dichotomy': {
            const headers = ['k', 'a', 'b', 'c = (a+b)/2', 'f(c)', '|b−a|'];
            const rows = visible.map((s, i) => [
                i + 1,
                fmt(s.a),
                fmt(s.b),
                fmt(s.c ?? (s.a + s.b) / 2),
                fmt(s.fc),
                fmt(Math.abs(s.b - s.a))
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 4: Ньютон ─────────────────────────────────────────────────
        case 'task4:newton': {
            const headers = ['k', 'xₙ', 'f(xₙ)', "f'(xₙ)", 'x_{n+1}', '|error|'];
            const rows = visible.map((s, i) => [
                i + 1,
                fmt(s.x_prev),
                fmt(s.fx),
                fmt(s.dfx),
                fmt(s.x_new),
                fmt(Math.abs(s.x_new - s.x_prev))
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 4: Простая итерация (уравнение) ───────────────────────────
        case 'task4:simple_iter': {
            const headers = ['k', 'x_prev', 'x_new', '|error|'];
            const rows = visible.map((s, i) => [
                i + 1,
                fmt(s.x_prev),
                fmt(s.x_new),
                fmt(s.fx)
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 5: Лагранж ────────────────────────────────────────────────
        case 'task5:lagrange': {
            const headers = ['i', 'Lᵢ(x*)', 'yᵢ', 'yᵢ · Lᵢ(x*)'];
            const rows = steps.map((s, i) => [
                i,
                fmt(s.li_x),
                fmt(s.yi),
                fmt(s.term)
            ]);
            return { headers, rows, activeRow: stepIndex };
        }

        // ── Задание 5: Ньютон (интерполяция) ─────────────────────────────────
        case 'task5:newton': {
            const maxVals = Math.max(...steps.map(s => (s.values ?? []).length));
            const headers = ['Порядок', ...Array.from({ length: maxVals }, (_, j) => `f[${j}]`)];
            const rows = steps.map(s => [
                s.order,
                ...(s.values ?? []).map(v => fmt(v))
            ]);
            return { headers, rows, activeRow: stepIndex };
        }

        // ── Задание 6: Кубический сплайн ──────────────────────────────────────
        case 'task6:cubic_spline': {
            const headers = ['i', '[xᵢ, xᵢ₊₁]', 'a', 'b', 'c', 'd'];
            const rows = steps.map((s, i) => [
                i,
                `[${fmt(s.x_left, 3)}, ${fmt(s.x_right, 3)}]`,
                fmt(s.a),
                fmt(s.b),
                fmt(s.c),
                fmt(s.d)
            ]);
            return { headers, rows, activeRow: stepIndex };
        }

        // ── Задание 7: МНК ────────────────────────────────────────────────────
        case 'task7:lss': {
            // На шаге result — таблица остатков
            if (current?.kind === 'result' && extra?.x) {
                const xs = extra.x, ys = extra.y;
                const cl = extra.coeffsLinear ?? [];
                const cq = extra.coeffsQuad ?? [];
                const headers = ['i', 'xᵢ', 'yᵢ', 'ŷ линейн.', 'ŷ квадр.', '|res_lin|'];
                const rows = xs.map((x, i) => {
                    const yLin = cl.length >= 2 ? cl[0] + cl[1] * x : 0;
                    const yQuad = cq.length >= 3 ? cq[0] + cq[1] * x + cq[2] * x * x : 0;
                    return [i, fmt(x, 3), fmt(ys[i]), fmt(yLin), fmt(yQuad), fmt(Math.abs(ys[i] - yLin))];
                });
                return { headers, rows, activeRow: -1 }; // без подсветки на result-шаге
            }
            // На шагах Гаусса — прогрессивно
            const headers = ['k', 'Вед. строка', 'Степень', 'Фаза'];
            const rows = visible.map((s, i) => [
                i + 1,
                (s.pivot ?? 0) + 1,
                s.degree ?? '—',
                s.phase === 'forward' ? 'прямой' : s.phase === 'backward' ? 'обратный' : s.kind ?? '—'
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 8: Дифференцирование ──────────────────────────────────────
        case 'task8:diff': {
            const headers = ['i', 'xᵢ', 'yᵢ', "y'(xᵢ)", "y''(xᵢ)", 'Формула'];
            const rows = steps.map(s => [
                s.i,
                fmt(s.x, 4),
                fmt(s.y),
                fmt(s.dy1),
                fmt(s.dy2),
                s.formula ?? '—'
            ]);
            return { headers, rows, activeRow: stepIndex };
        }

        // ── Задание 9: Симпсон ────────────────────────────────────────────────
        case 'task9:simpson': {
            const headers = ['k', 'h', 'n', 'S', '|S−S_prev|/15'];
            const rows = visible.map(s => [
                s.k,
                fmt(s.h, 5),
                s.n,
                fmt(s.s),
                fmt(s.diff)
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 10: Задача Коши ───────────────────────────────────────────
        case 'task10:cauchy': {
            const headers = ['k', 'xₖ', 'y_RK4', 'k₁', 'k₂', 'k₃', 'k₄', 'y_Adams', '|diff|', 'Фаза'];
            const rows = visible.map(s => [
                s.k,
                fmt(s.x, 4),
                fmt(s.y_rk4),
                fmt(s.k1),
                fmt(s.k2),
                fmt(s.k3),
                fmt(s.k4),
                s.phase === 'adams' ? fmt(s.y_adams) : '—',
                s.phase === 'adams' ? fmt(s.diff) : '—',
                s.phase === 'rk4' ? 'РК4' : 'Адамс'
            ]);
            return { headers, rows, activeRow: rows.length - 1 };
        }

        // ── Задание 11: Краевая задача ────────────────────────────────────────
        case 'task11:bvp': {
            if (current?.phase === 'build') {
                const buildRows = visible.filter(s => s.phase === 'build');
                const headers = ['i', 'xᵢ', 'RHS', 'Ненул. коэф.'];
                const rows = buildRows.map(s => [
                    s.row_idx,
                    fmt(s.x, 4),
                    fmt(s.rhs),
                    (s.mat_row ?? []).filter(v => Math.abs(v) > 1e-12).map(v => fmt(v, 4)).join('  ')
                ]);
                return { headers, rows, activeRow: rows.length - 1 };
            } else if (current?.phase === 'gauss_forward') {
                const fwdRows = visible.filter(s => s.phase === 'gauss_forward');
                const headers = ['k', 'Вед. строка', 'Фаза'];
                const rows = fwdRows.map((s, i) => [i + 1, (s.pivot ?? 0) + 1, 'прямой']);
                return { headers, rows, activeRow: rows.length - 1 };
            } else {
                // gauss_backward — показываем вычисленные y
                const bwdRows = visible.filter(s => s.phase === 'gauss_backward');
                const headers = ['k', 'y(xₖ)'];
                const rows = bwdRows.map((s, i) => {
                    const lastY = s.gauss_x ? s.gauss_x[s.pivot] : null;
                    return [s.pivot ?? i, lastY != null ? fmt(lastY) : '—'];
                });
                return { headers, rows, activeRow: rows.length - 1 };
            }
        }

        default:
            return null;
    }
}

/**
 * Рендерит итерационную таблицу.
 * @param {string} taskId - 'task1' .. 'task11'
 * @param {string} method - 'gauss', 'simple_iter', ...
 * @param {number} stepIndex - индекс текущего шага (0-based)
 * @param {Array}  steps    - массив всех шагов
 * @param {*}      extra    - доп. данные (точки, формула и т.д.)
 */
export function renderTable(taskId, method, stepIndex, steps, extra) {
    if (!steps || steps.length === 0) return;

    const data = buildTableData(taskId, method, stepIndex, steps, extra);
    if (!data) return;

    const th = thead(), tb = tbody();
    if (!th || !tb) return;

    // ── Заголовок ──
    th.innerHTML = '';
    const headerRow = document.createElement('tr');
    data.headers.forEach(h => {
        const cell = document.createElement('th');
        cell.className = 'px-3 py-1.5 text-left font-semibold text-gray-500 border-b border-white/5 sticky top-0 bg-brand-surface/95 backdrop-blur';
        cell.textContent = h;
        headerRow.appendChild(cell);
    });
    th.appendChild(headerRow);

    // ── Строки ──
    tb.innerHTML = '';
    const activeRow = data.activeRow ?? stepIndex;
    let activeEl = null;
    data.rows.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        const isCurrent = rowIdx === activeRow;
        tr.className = isCurrent
            ? 'bg-brand-accent/10 text-brand-accent'
            : 'text-gray-400 hover:bg-white/[0.03] transition-colors';

        row.forEach(cell => {
            const td = document.createElement('td');
            td.className = 'px-3 py-1 border-b border-white/5 whitespace-nowrap';
            td.textContent = cell;
            tr.appendChild(td);
        });

        tb.appendChild(tr);
        if (isCurrent) activeEl = tr;
    });

    setTableVisible(true);

    // Прокручиваем текущую строку в область видимости
    if (activeEl) {
        requestAnimationFrame(() => activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
}
