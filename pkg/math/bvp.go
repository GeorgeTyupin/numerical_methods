package math

import (
	"fmt"
	"math"

	"github.com/GeorgeTyupin/numerical_methods/pkg/math/mathutils"
	"github.com/Knetic/govaluate"
)

// BVPStep — шаг решения краевой задачи.
//
// phase "build":          — формирование строки матрицы СЛАУ
// phase "gauss_forward":  — прямой ход Гаусса
// phase "gauss_backward": — обратный ход Гаусса
type BVPStep struct {
	Phase  string // "build" | "gauss_forward" | "gauss_backward"
	RowIdx int    // индекс строки (для build)
	X      float64

	// build — полная строка матрицы + правая часть
	MatRow []float64
	RHS    float64

	// gauss — поля как в GaussStep
	Matrix [][]float64
	Vector []float64
	Pivot  int
	GaussX []float64 // частичное решение (backward)
}

// BVPCalculator решает краевую задачу y'' + p(x)y' + q(x)y = f(x)
// с граничными условиями общего вида:
//
//	αA·y(a) + βA·y'(a) = γA  (Дирихле/Неймана/Робена слева)
//	αB·y(b) + βB·y'(b) = γB  (Дирихле/Неймана/Робена справа)
type BVPCalculator struct {
	PFunc, QFunc, FFunc          *govaluate.EvaluableExpression
	A, B                          float64
	AlphaA, BetaA, GammaA float64
	AlphaB, BetaB, GammaB float64
	H                             float64
}

func NewBVPCalculator(pStr, qStr, fStr string, a, b float64,
	alphaA, betaA, gammaA, alphaB, betaB, gammaB, h float64) (*BVPCalculator, error) {
	if b <= a {
		return nil, fmt.Errorf("b должно быть больше a")
	}
	if h <= 0 {
		return nil, fmt.Errorf("шаг h должен быть положительным")
	}
	pFn, err := mathutils.ParseFormula(pStr)
	if err != nil {
		return nil, fmt.Errorf("ошибка в p(x): %w", err)
	}
	qFn, err := mathutils.ParseFormula(qStr)
	if err != nil {
		return nil, fmt.Errorf("ошибка в q(x): %w", err)
	}
	fFn, err := mathutils.ParseFormula(fStr)
	if err != nil {
		return nil, fmt.Errorf("ошибка в f(x): %w", err)
	}
	return &BVPCalculator{
		PFunc: pFn, QFunc: qFn, FFunc: fFn,
		A: a, B: b,
		AlphaA: alphaA, BetaA: betaA, GammaA: gammaA,
		AlphaB: alphaB, BetaB: betaB, GammaB: gammaB,
		H: h,
	}, nil
}

func (c *BVPCalculator) evalExpr(expr *govaluate.EvaluableExpression, x float64) float64 {
	res, _ := expr.Evaluate(map[string]interface{}{"x": x, "pi": math.Pi, "e": math.E})
	val, ok := res.(float64)
	if !ok {
		return math.NaN()
	}
	return val
}

// Calculate строит и решает разностную схему для краевой задачи общего вида.
func (c *BVPCalculator) Calculate() ([]BVPStep, []float64, []float64, error) {
	N := int(math.Round((c.B - c.A) / c.H))
	if N < 2 {
		return nil, nil, nil, fmt.Errorf("слишком большой шаг: нужно минимум 2 интервала (N≥2)")
	}
	h := (c.B - c.A) / float64(N)

	// Сетка: x₀, x₁, ..., x_N
	xArr := make([]float64, N+1)
	for i := range xArr {
		xArr[i] = c.A + float64(i)*h
	}

	size := N + 1
	mat := make([][]float64, size)
	for i := range mat {
		mat[i] = make([]float64, size)
	}
	rhs := make([]float64, size)

	c2h := 1.0 / (2 * h)

	// ── Строка 0: левое граничное условие ────────────────────────────────────────
	// αA·y₀ + βA·(-3y₀ + 4y₁ - y₂)/(2h) = γA
	// → (αA - 3βA·c2h)·y₀ + (4βA·c2h)·y₁ + (-βA·c2h)·y₂ = γA
	mat[0][0] = c.AlphaA - 3*c.BetaA*c2h
	if N >= 1 {
		mat[0][1] = 4 * c.BetaA * c2h
	}
	if N >= 2 {
		mat[0][2] = -c.BetaA * c2h
	}
	rhs[0] = c.GammaA

	var steps []BVPStep
	steps = append(steps, BVPStep{
		Phase:  "build",
		RowIdx: 0, X: xArr[0],
		MatRow: append([]float64{}, mat[0]...),
		RHS:    rhs[0],
	})

	// ── Строки 1..N-1: внутренние узлы (уравнение ОДУ) ───────────────────────────
	for i := 1; i < N; i++ {
		xi := xArr[i]
		pi := c.evalExpr(c.PFunc, xi)
		qi := c.evalExpr(c.QFunc, xi)
		fi := c.evalExpr(c.FFunc, xi)

		alpha := 1/(h*h) - pi/(2*h)
		beta := -2/(h*h) + qi
		gamma := 1/(h*h) + pi/(2*h)

		mat[i][i-1] = alpha
		mat[i][i] = beta
		mat[i][i+1] = gamma
		rhs[i] = fi

		steps = append(steps, BVPStep{
			Phase:  "build",
			RowIdx: i, X: xi,
			MatRow: append([]float64{}, mat[i]...),
			RHS:    rhs[i],
		})
	}

	// ── Строка N: правое граничное условие ───────────────────────────────────────
	// αB·y_N + βB·(y_{N-2} - 4y_{N-1} + 3y_N)/(2h) = γB
	// → (βB·c2h)·y_{N-2} + (-4βB·c2h)·y_{N-1} + (αB + 3βB·c2h)·y_N = γB
	if N >= 2 {
		mat[N][N-2] = c.BetaB * c2h
	}
	if N >= 1 {
		mat[N][N-1] = -4 * c.BetaB * c2h
	}
	mat[N][N] = c.AlphaB + 3*c.BetaB*c2h
	rhs[N] = c.GammaB

	steps = append(steps, BVPStep{
		Phase:  "build",
		RowIdx: N, X: xArr[N],
		MatRow: append([]float64{}, mat[N]...),
		RHS:    rhs[N],
	})

	// ── Решаем методом Гаусса ─────────────────────────────────────────────────────
	gaussCalc, err := NewGaussCalculator(mat, rhs)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("BVP Гаусс: %w", err)
	}
	gaussSteps, solution, err := gaussCalc.Calculate()
	if err != nil {
		return nil, nil, nil, fmt.Errorf("BVP Гаусс: %w", err)
	}

	for _, gs := range gaussSteps {
		phase := "gauss_forward"
		if gs.Phase == "backward" {
			phase = "gauss_backward"
		}
		s := BVPStep{
			Phase:  phase,
			Matrix: gs.Matrix,
			Vector: gs.Vector,
			Pivot:  gs.Pivot,
		}
		if gs.X != nil {
			s.GaussX = append([]float64{}, gs.X...)
		}
		steps = append(steps, s)
	}

	return steps, xArr, solution, nil
}
