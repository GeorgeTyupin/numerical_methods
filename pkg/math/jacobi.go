package math

import (
	"fmt"
	"math"
)

type JacobiStep struct {
	Matrix [][]float64
	P      int
	Q      int
	Norm   float64
	Phase  string // "rotation" | "extract"
}

type JacobiCalculator struct {
	Matrix  [][]float64
	Epsilon float64
	n       int
}

func NewJacobiCalculator(matrix [][]float64, epsilon float64) (*JacobiCalculator, error) {
	n := len(matrix)
	if n == 0 {
		return nil, fmt.Errorf("матрица не может быть пустой")
	}
	for i, row := range matrix {
		if len(row) != n {
			return nil, fmt.Errorf("матрица должна быть квадратной")
		}
		for j := 0; j < n; j++ {
			if math.Abs(matrix[i][j]-matrix[j][i]) > 1e-10 {
				return nil, fmt.Errorf("матрица должна быть симметричной")
			}
		}
	}
	m := copyMatrix(matrix)
	return &JacobiCalculator{Matrix: m, Epsilon: epsilon, n: n}, nil
}

// offDiagNorm вычисляет сумму квадратов внедиагональных элементов
func offDiagNorm(m [][]float64) float64 {
	n := len(m)
	sum := 0.0
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			if i != j {
				sum += m[i][j] * m[i][j]
			}
		}
	}
	return math.Sqrt(sum)
}

// maxOffDiag находит позицию максимального внедиагонального элемента по модулю
func maxOffDiag(m [][]float64) (int, int) {
	n := len(m)
	p, q := 0, 1
	maxVal := math.Abs(m[0][1])
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			if math.Abs(m[i][j]) > maxVal {
				maxVal = math.Abs(m[i][j])
				p, q = i, j
			}
		}
	}
	return p, q
}

func (c *JacobiCalculator) Calculate() ([]JacobiStep, []float64, [][]float64, int, error) {
	n := c.n
	m := copyMatrix(c.Matrix)

	// Матрица собственных векторов (начально — единичная)
	eigVecs := make([][]float64, n)
	for i := range eigVecs {
		eigVecs[i] = make([]float64, n)
		eigVecs[i][i] = 1.0
	}

	var steps []JacobiStep

	for iter := 1; iter <= maxIter; iter++ {
		norm := offDiagNorm(m)
		if norm < c.Epsilon {
			// Финальный шаг: извлечение собственных значений с диагонали
			steps = append(steps, JacobiStep{
				Matrix: copyMatrix(m),
				P:      -1,
				Q:      -1,
				Norm:   norm,
				Phase:  "extract",
			})
			eigenvalues := make([]float64, n)
			for i := 0; i < n; i++ {
				eigenvalues[i] = m[i][i]
			}
			return steps, eigenvalues, eigVecs, iter, nil
		}

		p, q := maxOffDiag(m)

		// Угол поворота
		var theta float64
		if math.Abs(m[p][p]-m[q][q]) < 1e-12 {
			theta = math.Pi / 4.0
		} else {
			theta = 0.5 * math.Atan(2*m[p][q]/(m[p][p]-m[q][q]))
		}

		cosT := math.Cos(theta)
		sinT := math.Sin(theta)

		// Применяем матрицу вращения A' = R^T * A * R
		newM := copyMatrix(m)
		newM[p][p] = m[p][p]*cosT*cosT + 2*m[p][q]*sinT*cosT + m[q][q]*sinT*sinT
		newM[q][q] = m[p][p]*sinT*sinT - 2*m[p][q]*sinT*cosT + m[q][q]*cosT*cosT
		newM[p][q] = 0.0
		newM[q][p] = 0.0

		for i := 0; i < n; i++ {
			if i != p && i != q {
				newM[i][p] = m[i][p]*cosT + m[i][q]*sinT
				newM[p][i] = newM[i][p]
				newM[i][q] = -m[i][p]*sinT + m[i][q]*cosT
				newM[q][i] = newM[i][q]
			}
		}

		// Обновляем матрицу собственных векторов
		newEigVecs := copyMatrix(eigVecs)
		for i := 0; i < n; i++ {
			newEigVecs[i][p] = eigVecs[i][p]*cosT + eigVecs[i][q]*sinT
			newEigVecs[i][q] = -eigVecs[i][p]*sinT + eigVecs[i][q]*cosT
		}

		steps = append(steps, JacobiStep{
			Matrix: copyMatrix(newM),
			P:      p,
			Q:      q,
			Norm:   norm,
			Phase:  "rotation",
		})

		m = newM
		eigVecs = newEigVecs
	}

	steps = append(steps, JacobiStep{
		Matrix: copyMatrix(m),
		P:      -1,
		Q:      -1,
		Norm:   offDiagNorm(m),
		Phase:  "extract",
	})
	eigenvalues := make([]float64, n)
	for i := 0; i < n; i++ {
		eigenvalues[i] = m[i][i]
	}
	return steps, eigenvalues, eigVecs, maxIter, fmt.Errorf("превышено максимальное количество итераций")
}
