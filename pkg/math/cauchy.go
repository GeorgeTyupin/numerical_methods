package math

import (
	"fmt"
	"math"

	"github.com/GeorgeTyupin/numerical_methods/pkg/math/mathutils"
	"github.com/Knetic/govaluate"
)

// CauchyStep — один шаг задачи Коши.
type CauchyStep struct {
	K      int
	X      float64
	YRK4   float64
	K1     float64
	K2     float64
	K3     float64
	K4     float64
	Phase  string  // "rk4" | "adams"
	YAdams float64 // значение метода Адамса (0 для первых 4 шагов фазы rk4)
	Diff   float64 // |YRK4 - YAdams|
}

// CauchyCalculator решает задачу Коши методами РК4 и Адамса.
type CauchyCalculator struct {
	Func        *govaluate.EvaluableExpression
	X0, Y0      float64
	XEnd, H     float64
}

// NewCauchyCalculator создаёт калькулятор задачи Коши.
// formula — выражение f(x, y), например "x^2 - 2*y"
func NewCauchyCalculator(formula string, x0, y0, xEnd, h float64) (*CauchyCalculator, error) {
	if h <= 0 {
		return nil, fmt.Errorf("шаг h должен быть положительным")
	}
	if xEnd <= x0 {
		return nil, fmt.Errorf("x_end должен быть больше x0")
	}
	fn, err := mathutils.ParseFormula(formula)
	if err != nil {
		return nil, err
	}
	return &CauchyCalculator{Func: fn, X0: x0, Y0: y0, XEnd: xEnd, H: h}, nil
}

// eval вычисляет f(x, y)
func (c *CauchyCalculator) eval(x, y float64) float64 {
	res, _ := c.Func.Evaluate(map[string]interface{}{"x": x, "y": y, "pi": math.Pi, "e": math.E})
	val, ok := res.(float64)
	if !ok {
		return math.NaN()
	}
	return val
}

// rk4Step выполняет один шаг РК4, возвращает k1..k4 и новое y.
func (c *CauchyCalculator) rk4Step(x, y float64) (k1, k2, k3, k4, yNew float64) {
	h := c.H
	k1 = h * c.eval(x, y)
	k2 = h * c.eval(x+h/2, y+k1/2)
	k3 = h * c.eval(x+h/2, y+k2/2)
	k4 = h * c.eval(x+h, y+k3)
	yNew = y + (k1+2*k2+2*k3+k4)/6
	return
}

// Calculate выполняет РК4 и метод Адамса одновременно.
func (c *CauchyCalculator) Calculate() ([]CauchyStep, error) {
	N := int(math.Round((c.XEnd - c.X0) / c.H))
	if N < 1 {
		return nil, fmt.Errorf("слишком большой шаг h")
	}

	xArr := make([]float64, N+1)
	yRK4 := make([]float64, N+1)
	fArr := make([]float64, N+1) // f(xk, yRK4[k])

	// Начальное условие
	xArr[0] = c.X0
	yRK4[0] = c.Y0
	fArr[0] = c.eval(c.X0, c.Y0)

	steps := make([]CauchyStep, 0, N+1)

	// Нулевой шаг
	steps = append(steps, CauchyStep{
		K: 0, X: xArr[0], YRK4: yRK4[0],
		Phase: "rk4", YAdams: yRK4[0], Diff: 0,
	})

	// ── Фаза РК4: все шаги ────────────────────────────────────────────────────
	for k := 0; k < N; k++ {
		k1, k2, k3, k4, yNew := c.rk4Step(xArr[k], yRK4[k])
		xArr[k+1] = c.X0 + float64(k+1)*c.H
		yRK4[k+1] = yNew
		fArr[k+1] = c.eval(xArr[k+1], yNew)

		steps = append(steps, CauchyStep{
			K: k + 1, X: xArr[k+1], YRK4: yNew,
			K1: k1, K2: k2, K3: k3, K4: k4,
			Phase: "rk4", YAdams: yNew, Diff: 0,
		})
	}

	// ── Метод Адамса (4-шаговый предиктор-корректор) ─────────────────────────
	if N < 4 {
		// Недостаточно точек для Адамса — возвращаем только РК4
		return steps, nil
	}

	yAdams := make([]float64, N+1)
	fAdams := make([]float64, N+1)
	// Первые 4 точки берём из РК4
	for i := 0; i < 4; i++ {
		yAdams[i] = yRK4[i]
		fAdams[i] = c.eval(xArr[i], yAdams[i])
	}

	// Обновляем шаги 0..3: теперь у них есть YAdams
	for i := 0; i <= 3; i++ {
		steps[i].YAdams = yAdams[i]
	}

	adamsSteps := make([]CauchyStep, 0, N-3)
	for k := 3; k < N; k++ {
		// Предиктор (явный Адамс-Башфорт 4-го порядка)
		yPred := yAdams[k] + c.H/24*(
			55*fAdams[k]-59*fAdams[k-1]+37*fAdams[k-2]-9*fAdams[k-3])
		fPred := c.eval(xArr[k+1], yPred)

		// Корректор (неявный Адамс-Мультон 4-го порядка)
		yCor := yAdams[k] + c.H/24*(
			9*fPred+19*fAdams[k]-5*fAdams[k-1]+fAdams[k-2])
		yAdams[k+1] = yCor
		fAdams[k+1] = c.eval(xArr[k+1], yCor)

		diff := math.Abs(yRK4[k+1] - yCor)
		adamsSteps = append(adamsSteps, CauchyStep{
			K: k + 1, X: xArr[k+1],
			YRK4: yRK4[k+1], Phase: "adams",
			YAdams: yCor, Diff: diff,
		})
	}

	// Заменяем шаги 4..N в финальном массиве на версию с Адамсом
	for i, as := range adamsSteps {
		steps[4+i] = as
	}

	return steps, nil
}
