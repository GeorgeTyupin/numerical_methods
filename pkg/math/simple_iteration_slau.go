package math

import (
	"fmt"
	"math"
)

type SimpleIterSLAUStep struct {
	X    []float64
	Norm float64
}

type SimpleIterSLAUCalculator struct {
	Matrix  [][]float64
	Vector  []float64
	Epsilon float64
}

func NewSimpleIterSLAUCalculator(matrix [][]float64, vector []float64, epsilon float64) (*SimpleIterSLAUCalculator, error) {
	n := len(vector)
	if n == 0 {
		return nil, fmt.Errorf("вектор не может быть пустым")
	}
	if len(matrix) != n {
		return nil, fmt.Errorf("размерность матрицы не совпадает с размерностью вектора")
	}
	for _, row := range matrix {
		if len(row) != n {
			return nil, fmt.Errorf("матрица должна быть квадратной")
		}
	}
	// Проверка диагонального преобладания
	for i := 0; i < n; i++ {
		sum := 0.0
		for j := 0; j < n; j++ {
			if j != i {
				sum += math.Abs(matrix[i][j])
			}
		}
		if math.Abs(matrix[i][i]) <= sum {
			return nil, fmt.Errorf("матрица не имеет диагонального преобладания, метод может не сойтись (строка %d)", i+1)
		}
	}

	m := make([][]float64, n)
	for i, row := range matrix {
		m[i] = make([]float64, n)
		copy(m[i], row)
	}
	v := make([]float64, n)
	copy(v, vector)

	return &SimpleIterSLAUCalculator{Matrix: m, Vector: v, Epsilon: epsilon}, nil
}

func (c *SimpleIterSLAUCalculator) Calculate() ([]SimpleIterSLAUStep, []float64, int, error) {
	n := len(c.Vector)
	x := make([]float64, n)
	var steps []SimpleIterSLAUStep

	for iter := 1; iter <= maxIter; iter++ {
		xNew := make([]float64, n)
		for i := 0; i < n; i++ {
			sum := c.Vector[i]
			for j := 0; j < n; j++ {
				if j != i {
					sum -= c.Matrix[i][j] * x[j]
				}
			}
			xNew[i] = sum / c.Matrix[i][i]
		}

		// Норма разности
		norm := 0.0
		for i := 0; i < n; i++ {
			d := math.Abs(xNew[i] - x[i])
			if d > norm {
				norm = d
			}
		}

		steps = append(steps, SimpleIterSLAUStep{
			X:    copyVector(xNew),
			Norm: norm,
		})

		x = xNew

		if norm < c.Epsilon {
			return steps, x, iter, nil
		}
	}

	return steps, x, maxIter, fmt.Errorf("превышено максимальное количество итераций")
}
