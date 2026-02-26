export function evaluateMathStr(expr, x) {
    try {
        let parts = expr.split('=');
        let jsExpr = parts[0].trim();
        if (parts.length === 2) {
            let right = parts[1].trim();
            if (right !== '0') {
                jsExpr = `(${jsExpr}) - (${right})`;
            }
        }

        jsExpr = jsExpr.replace(/\^/g, '**');
        jsExpr = jsExpr.replace(/(ln|log|sin|cos|tan|sqrt|abs|exp)\s+([a-zA-Z0-9_\.]+)/g, '$1($2)');
        jsExpr = jsExpr.replace(/\bln\b/g, 'log');
        jsExpr = jsExpr.replace(/sin|cos|tan|log|exp|sqrt|abs/g, match => `Math.${match}`);
        
        return new Function('x', `return ${jsExpr}`)(x);
    } catch (e) {
        return null;
    }
}
