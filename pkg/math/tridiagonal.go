package math

import (
	"fmt"
	"math"
)

// TridiagonalStep — состояние коэффициентов прогонки на каждом шаге
type TridiagonalStep struct {
	Alpha []float64
	Beta  []float64
	Index int
	Phase string    // "forward" | "backward"
	X     []float64 // частичное решение (только для backward)
}

// TridiagonalCalculator решает трёхдиагональную СЛАУ методом прогонки (алгоритм Томаса).
// Система: a[i]*x[i-1] + b[i]*x[i] + c[i]*x[i+1] = d[i]
// a[0] = 0, c[n-1] = 0
type TridiagonalCalculator struct {
	A []float64 // нижняя диагональ (a[0] не используется)
	B []float64 // главная диагональ
	C []float64 // верхняя диагональ (c[n-1] не используется)
	D []float64 // правая часть
}

func NewTridiagonalCalculator(a, b, c, d []float64) (*TridiagonalCalculator, error) {
	n := len(d)
	if n == 0 {
		return nil, fmt.Errorf("вектор правой части не может быть пустым")
	}
	if len(a) != n || len(b) != n || len(c) != n {
		return nil, fmt.Errorf("все векторы должны иметь одинаковую длину n=%d", n)
	}
	for i := 0; i < n; i++ {
		if math.Abs(b[i]) < 1e-12 {
			return nil, fmt.Errorf("нулевой диагональный элемент b[%d]", i)
		}
	}
	return &TridiagonalCalculator{
		A: append([]float64{}, a...),
		B: append([]float64{}, b...),
		C: append([]float64{}, c...),
		D: append([]float64{}, d...),
	}, nil
}

func (c *TridiagonalCalculator) Calculate() ([]TridiagonalStep, []float64, error) {
	n := len(c.D)
	alpha := make([]float64, n)
	beta := make([]float64, n)
	var steps []TridiagonalStep

	// Прямой ход
	alpha[0] = -c.C[0] / c.B[0]
	beta[0] = c.D[0] / c.B[0]

	steps = append(steps, TridiagonalStep{
		Alpha: append([]float64{}, alpha...),
		Beta:  append([]float64{}, beta...),
		Index: 0,
		Phase: "forward",
	})

	for i := 1; i < n; i++ {
		denom := c.B[i] + c.A[i]*alpha[i-1]
		if math.Abs(denom) < 1e-12 {
			return nil, nil, fmt.Errorf("нулевой знаменатель на шаге %d прямого хода", i)
		}
		alpha[i] = -c.C[i] / denom
		beta[i] = (c.D[i] - c.A[i]*beta[i-1]) / denom

		steps = append(steps, TridiagonalStep{
			Alpha: append([]float64{}, alpha...),
			Beta:  append([]float64{}, beta...),
			Index: i,
			Phase: "forward",
		})
	}

	// Обратный ход с записью шагов
	x := make([]float64, n)
	x[n-1] = beta[n-1]
	steps = append(steps, TridiagonalStep{
		Alpha: append([]float64{}, alpha...),
		Beta:  append([]float64{}, beta...),
		Index: n - 1,
		Phase: "backward",
		X:     copyVector(x),
	})

	for i := n - 2; i >= 0; i-- {
		x[i] = alpha[i]*x[i+1] + beta[i]
		steps = append(steps, TridiagonalStep{
			Alpha: append([]float64{}, alpha...),
			Beta:  append([]float64{}, beta...),
			Index: i,
			Phase: "backward",
			X:     copyVector(x),
		})
	}

	return steps, x, nil
}
