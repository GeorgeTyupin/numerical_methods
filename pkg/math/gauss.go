package math

import (
	"fmt"
	"math"
)

type GaussStep struct {
	Matrix [][]float64
	Vector []float64
	Pivot  int
	Phase  string    // "forward" | "backward"
	X      []float64 // частичное решение (только для backward)
}

type GaussCalculator struct {
	Matrix  [][]float64
	Vector  []float64
}

func NewGaussCalculator(matrix [][]float64, vector []float64) (*GaussCalculator, error) {
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
	m := make([][]float64, n)
	for i, row := range matrix {
		m[i] = make([]float64, n)
		copy(m[i], row)
	}
	v := make([]float64, n)
	copy(v, vector)
	return &GaussCalculator{Matrix: m, Vector: v}, nil
}

func copyMatrix(m [][]float64) [][]float64 {
	n := len(m)
	c := make([][]float64, n)
	for i := range m {
		c[i] = make([]float64, len(m[i]))
		copy(c[i], m[i])
	}
	return c
}

func copyVector(v []float64) []float64 {
	c := make([]float64, len(v))
	copy(c, v)
	return c
}

func (c *GaussCalculator) Calculate() ([]GaussStep, []float64, error) {
	n := len(c.Vector)
	m := copyMatrix(c.Matrix)
	b := copyVector(c.Vector)

	var steps []GaussStep

	// Прямой ход с выбором главного элемента по столбцу
	for col := 0; col < n; col++ {
		// Поиск ведущего элемента
		maxRow := col
		maxVal := math.Abs(m[col][col])
		for row := col + 1; row < n; row++ {
			if math.Abs(m[row][col]) > maxVal {
				maxVal = math.Abs(m[row][col])
				maxRow = row
			}
		}

		if maxVal < 1e-12 {
			return nil, nil, fmt.Errorf("матрица вырождена или система несовместна")
		}

		// Перестановка строк
		if maxRow != col {
			m[col], m[maxRow] = m[maxRow], m[col]
			b[col], b[maxRow] = b[maxRow], b[col]
		}

		// Сохраняем состояние после выбора ведущего элемента
		steps = append(steps, GaussStep{
			Matrix: copyMatrix(m),
			Vector: copyVector(b),
			Pivot:  col,
			Phase:  "forward",
		})

		// Исключение
		for row := col + 1; row < n; row++ {
			factor := m[row][col] / m[col][col]
			for j := col; j < n; j++ {
				m[row][j] -= factor * m[col][j]
			}
			b[row] -= factor * b[col]
		}
	}

	// Обратная подстановка с записью шагов
	x := make([]float64, n)
	for i := n - 1; i >= 0; i-- {
		sum := b[i]
		for j := i + 1; j < n; j++ {
			sum -= m[i][j] * x[j]
		}
		if math.Abs(m[i][i]) < 1e-12 {
			return nil, nil, fmt.Errorf("деление на ноль при обратной подстановке")
		}
		x[i] = sum / m[i][i]
		steps = append(steps, GaussStep{
			Matrix: copyMatrix(m),
			Vector: copyVector(b),
			Pivot:  i,
			Phase:  "backward",
			X:      copyVector(x),
		})
	}

	return steps, x, nil
}
