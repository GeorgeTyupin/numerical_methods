package math

import (
	"fmt"
	"math"
)

// LSSStep — шаг алгоритма МНК.
// kind: "build"         — формирование матрицы нормальных уравнений
//
//	"gauss_forward"  — прямой ход Гаусса (решение нормальной системы)
//	"gauss_backward" — обратный ход Гаусса
//	"result"         — итоговые коэффициенты
type LSSStep struct {
	Kind   string      // "build" | "gauss_forward" | "gauss_backward" | "result"
	Degree int         // 1 или 2
	Matrix [][]float64 // матрица нормальных уравнений (для build)
	Vector []float64   // RHS вектор (для build)
	Pivot  int         // ведущая строка (для gauss_*)
	Phase  string      // "forward" | "backward" (для gauss_*)
	X      []float64   // частичное/полное решение (для gauss_backward)
	Coeffs []float64   // коэффициенты (для result)
}

// LSSCalculator решает задачу МНК для линейного и квадратичного многочленов.
type LSSCalculator struct {
	XData []float64
	YData []float64
}

func NewLSSCalculator(x, y []float64) (*LSSCalculator, error) {
	if len(x) != len(y) {
		return nil, fmt.Errorf("длины x и y должны совпадать")
	}
	if len(x) < 3 {
		return nil, fmt.Errorf("нужно минимум 3 точки")
	}
	return &LSSCalculator{XData: x, YData: y}, nil
}

// evalPoly вычисляет значение многочлена степени len(coeffs)-1 в точке x.
func evalPoly(coeffs []float64, x float64) float64 {
	val := 0.0
	for i, c := range coeffs {
		val += c * math.Pow(x, float64(i))
	}
	return val
}

// buildNormalSystem строит матрицу и вектор нормальной системы для степени degree.
func (c *LSSCalculator) buildNormalSystem(degree int) ([][]float64, []float64) {
	n := degree + 1
	A := make([][]float64, n)
	for i := range A {
		A[i] = make([]float64, n)
	}
	b := make([]float64, n)

	for k := 0; k < len(c.XData); k++ {
		xk := c.XData[k]
		yk := c.YData[k]
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				A[i][j] += math.Pow(xk, float64(i+j))
			}
			b[i] += math.Pow(xk, float64(i)) * yk
		}
	}
	return A, b
}

// cloneMatrix глубоко копирует матрицу.
func cloneMatrix(m [][]float64) [][]float64 {
	cp := make([][]float64, len(m))
	for i := range m {
		cp[i] = append([]float64{}, m[i]...)
	}
	return cp
}

// solveWithGaussSteps решает систему методом Гаусса и возвращает шаги как LSSStep.
func (c *LSSCalculator) solveWithGaussSteps(degree int, A [][]float64, b []float64) ([]LSSStep, []float64, error) {
	n := len(b)
	// Создаём вычислитель Гаусса
	calc, err := NewGaussCalculator(A, b)
	if err != nil {
		return nil, nil, err
	}
	gaussSteps, solution, err := calc.Calculate()
	if err != nil {
		return nil, nil, err
	}

	steps := make([]LSSStep, 0, len(gaussSteps))
	for _, gs := range gaussSteps {
		kind := "gauss_forward"
		if gs.Phase == "backward" {
			kind = "gauss_backward"
		}
		step := LSSStep{
			Kind:   kind,
			Degree: degree,
			Matrix: gs.Matrix,
			Vector: gs.Vector,
			Pivot:  gs.Pivot,
			Phase:  gs.Phase,
		}
		if gs.X != nil {
			step.X = gs.X
		}
		steps = append(steps, step)
	}
	_ = n
	return steps, solution, nil
}

// Calculate выполняет МНК для степеней 1 и 2.
// Возвращает шаги, коэффициенты линейного и квадратичного многочленов.
func (c *LSSCalculator) Calculate() ([]LSSStep, []float64, []float64, error) {
	var allSteps []LSSStep

	// ── Степень 1 (линейный) ──────────────────────────────────────────────────
	A1, b1 := c.buildNormalSystem(1)
	// Шаг: показываем матрицу нормальных уравнений
	allSteps = append(allSteps, LSSStep{
		Kind:   "build",
		Degree: 1,
		Matrix: cloneMatrix(A1),
		Vector: append([]float64{}, b1...),
	})

	gaussSteps1, coeffsLin, err := c.solveWithGaussSteps(1, A1, b1)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("МНК линейный: %w", err)
	}
	allSteps = append(allSteps, gaussSteps1...)

	// ── Степень 2 (квадратичный) ──────────────────────────────────────────────
	A2, b2 := c.buildNormalSystem(2)
	allSteps = append(allSteps, LSSStep{
		Kind:   "build",
		Degree: 2,
		Matrix: cloneMatrix(A2),
		Vector: append([]float64{}, b2...),
	})

	gaussSteps2, coeffsQuad, err := c.solveWithGaussSteps(2, A2, b2)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("МНК квадратичный: %w", err)
	}
	allSteps = append(allSteps, gaussSteps2...)

	// ── Финальный шаг ──────────────────────────────────────────────────────────
	allSteps = append(allSteps, LSSStep{
		Kind:   "result",
		Degree: 2,
		Coeffs: coeffsQuad,
	})

	return allSteps, coeffsLin, coeffsQuad, nil
}

// GenerateCurve возвращает 200 точек кривой для многочлена.
func GenerateCurve(coeffs []float64, xMin, xMax float64) ([]float64, []float64) {
	const nPts = 200
	xs := make([]float64, nPts)
	ys := make([]float64, nPts)
	for i := range xs {
		x := xMin + float64(i)*(xMax-xMin)/float64(nPts-1)
		xs[i] = x
		ys[i] = evalPoly(coeffs, x)
	}
	return xs, ys
}
