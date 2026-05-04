package math

import (
	"fmt"
	"math"
)

type SeidelStep struct {
	X    []float64
	Norm float64
}

type SeidelCalculator struct {
	Matrix  [][]float64
	Vector  []float64
	Epsilon float64
}

func NewSeidelCalculator(matrix [][]float64, vector []float64, epsilon float64) (*SeidelCalculator, error) {
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
			return nil, fmt.Errorf("матрица не имеет диагонального преобладания (строка %d)", i+1)
		}
	}

	m := make([][]float64, n)
	for i, row := range matrix {
		m[i] = make([]float64, n)
		copy(m[i], row)
	}
	v := make([]float64, n)
	copy(v, vector)

	return &SeidelCalculator{Matrix: m, Vector: v, Epsilon: epsilon}, nil
}

func (c *SeidelCalculator) Calculate() ([]SeidelStep, []float64, int, error) {
	n := len(c.Vector)
	x := make([]float64, n)
	var steps []SeidelStep

	for iter := 1; iter <= maxIter; iter++ {
		xPrev := copyVector(x)

		for i := 0; i < n; i++ {
			sum := c.Vector[i]
			for j := 0; j < n; j++ {
				if j != i {
					sum -= c.Matrix[i][j] * x[j]
				}
			}
			x[i] = sum / c.Matrix[i][i]
		}

		norm := 0.0
		for i := 0; i < n; i++ {
			d := math.Abs(x[i] - xPrev[i])
			if d > norm {
				norm = d
			}
		}

		steps = append(steps, SeidelStep{
			X:    copyVector(x),
			Norm: norm,
		})

		if norm < c.Epsilon {
			return steps, x, iter, nil
		}
	}

	return steps, x, maxIter, fmt.Errorf("превышено максимальное количество итераций")
}
