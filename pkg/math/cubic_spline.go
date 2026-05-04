package math

import (
	"fmt"
	"math"
)

// SplineSegment — коэффициенты кубического сплайна на отрезке [x_i, x_{i+1}]
// S_i(x) = a_i + b_i*(x-x_i) + c_i*(x-x_i)^2 + d_i*(x-x_i)^3
type SplineSegment struct {
	XLeft float64
	XRight float64
	A     float64
	B     float64
	C     float64
	D     float64
}

// CubicSplineCalculator строит кубический сплайн дефекта 1 (C^2, естественные граничные условия)
type CubicSplineCalculator struct {
	X []float64
	Y []float64
}

func NewCubicSplineCalculator(x, y []float64) (*CubicSplineCalculator, error) {
	n := len(x)
	if n < 3 {
		return nil, fmt.Errorf("для кубического сплайна необходимо минимум 3 узла")
	}
	if len(y) != n {
		return nil, fmt.Errorf("x и y должны иметь одинаковую длину")
	}
	for i := 1; i < n; i++ {
		if x[i] <= x[i-1] {
			return nil, fmt.Errorf("узлы x должны быть строго возрастающими")
		}
	}
	return &CubicSplineCalculator{
		X: append([]float64{}, x...),
		Y: append([]float64{}, y...),
	}, nil
}

func (c *CubicSplineCalculator) Calculate() ([]SplineSegment, []float64, []float64, error) {
	n := len(c.X)
	m := n - 1 // количество отрезков

	h := make([]float64, m)
	for i := 0; i < m; i++ {
		h[i] = c.X[i+1] - c.X[i]
	}

	// Строим трёхдиагональную СЛАУ для моментов M[i] (i=0..n-1)
	// Естественные ГУ: M[0] = 0, M[n-1] = 0
	// Внутренние: h[i-1]*M[i-1] + 2*(h[i-1]+h[i])*M[i] + h[i]*M[i+1] = 6*((y[i+1]-y[i])/h[i] - (y[i]-y[i-1])/h[i-1])
	inner := n - 2 // количество внутренних узлов
	if inner <= 0 {
		return nil, nil, nil, fmt.Errorf("недостаточно узлов для построения сплайна")
	}

	a := make([]float64, inner)
	b := make([]float64, inner)
	diag := make([]float64, inner)
	rhs := make([]float64, inner)

	for i := 0; i < inner; i++ {
		idx := i + 1
		diag[i] = 2 * (h[idx-1] + h[idx])
		rhs[i] = 6 * ((c.Y[idx+1]-c.Y[idx])/h[idx] - (c.Y[idx]-c.Y[idx-1])/h[idx-1])
		if i > 0 {
			a[i] = h[idx-1]
		}
		if i < inner-1 {
			b[i] = h[idx]
		}
	}

	// Решаем методом прогонки
	M := make([]float64, n)
	M[0] = 0
	M[n-1] = 0

	if inner == 1 {
		M[1] = rhs[0] / diag[0]
	} else {
		// Thomas algorithm
		alpha := make([]float64, inner)
		beta := make([]float64, inner)
		alpha[0] = -b[0] / diag[0]
		beta[0] = rhs[0] / diag[0]
		for i := 1; i < inner; i++ {
			denom := diag[i] + a[i]*alpha[i-1]
			if math.Abs(denom) < 1e-12 {
				return nil, nil, nil, fmt.Errorf("нулевой знаменатель при решении системы для моментов")
			}
			alpha[i] = -b[i] / denom
			beta[i] = (rhs[i] - a[i]*beta[i-1]) / denom
		}
		M[inner] = beta[inner-1]
		for i := inner - 2; i >= 0; i-- {
			M[i+1] = alpha[i]*M[i+2] + beta[i]
		}
	}

	// Вычисляем коэффициенты сплайна на каждом отрезке
	segments := make([]SplineSegment, m)
	for i := 0; i < m; i++ {
		a0 := c.Y[i]
		b0 := (c.Y[i+1]-c.Y[i])/h[i] - h[i]*(2*M[i]+M[i+1])/6
		c0 := M[i] / 2
		d0 := (M[i+1] - M[i]) / (6 * h[i])
		segments[i] = SplineSegment{
			XLeft:  c.X[i],
			XRight: c.X[i+1],
			A:      a0,
			B:      b0,
			C:      c0,
			D:      d0,
		}
	}

	// Точки кривой сплайна
	numPoints := 300
	xMin := c.X[0]
	xMax := c.X[n-1]
	step := (xMax - xMin) / float64(numPoints-1)
	curveX := make([]float64, numPoints)
	curveY := make([]float64, numPoints)
	for i := 0; i < numPoints; i++ {
		xv := xMin + float64(i)*step
		curveX[i] = xv
		// Найти нужный отрезок
		seg := m - 1
		for j := 0; j < m-1; j++ {
			if xv <= c.X[j+1] {
				seg = j
				break
			}
		}
		dx := xv - c.X[seg]
		s := segments[seg]
		curveY[i] = s.A + s.B*dx + s.C*dx*dx + s.D*dx*dx*dx
	}

	return segments, curveX, curveY, nil
}
