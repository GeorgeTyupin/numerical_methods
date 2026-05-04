package math

import (
	"fmt"
)

type LagrangeStep struct {
	I      int
	LiX    float64 // значение базисного полинома L_i(x*)
	Yi     float64 // y_i
	Term   float64 // y_i * L_i(x*)
}

type LagrangeCalculator struct {
	X  []float64
	Y  []float64
	XS float64 // точка интерполяции
}

func NewLagrangeCalculator(x, y []float64, xs float64) (*LagrangeCalculator, error) {
	n := len(x)
	if n < 2 {
		return nil, fmt.Errorf("необходимо минимум 2 узла")
	}
	if len(y) != n {
		return nil, fmt.Errorf("x и y должны иметь одинаковую длину")
	}
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			if x[i] == x[j] {
				return nil, fmt.Errorf("узлы x должны быть различны")
			}
		}
	}
	return &LagrangeCalculator{
		X:  append([]float64{}, x...),
		Y:  append([]float64{}, y...),
		XS: xs,
	}, nil
}

// CurvePoints возвращает точки кривой многочлена на заданном отрезке (numPoints точек)
func (c *LagrangeCalculator) CurvePoints(numPoints int) ([]float64, []float64) {
	if numPoints < 2 {
		numPoints = 200
	}
	n := len(c.X)
	xMin, xMax := c.X[0], c.X[0]
	for _, v := range c.X {
		if v < xMin {
			xMin = v
		}
		if v > xMax {
			xMax = v
		}
	}
	span := xMax - xMin
	xMin -= span * 0.1
	xMax += span * 0.1
	step := (xMax - xMin) / float64(numPoints-1)

	xs := make([]float64, numPoints)
	ys := make([]float64, numPoints)
	for i := 0; i < numPoints; i++ {
		xv := xMin + float64(i)*step
		xs[i] = xv
		ys[i] = c.evalAt(xv, n)
	}
	return xs, ys
}

func (c *LagrangeCalculator) evalAt(xv float64, n int) float64 {
	result := 0.0
	for i := 0; i < n; i++ {
		li := 1.0
		for j := 0; j < n; j++ {
			if j != i {
				li *= (xv - c.X[j]) / (c.X[i] - c.X[j])
			}
		}
		result += c.Y[i] * li
	}
	return result
}

func (c *LagrangeCalculator) Calculate() ([]LagrangeStep, float64, []float64, []float64, error) {
	n := len(c.X)
	var steps []LagrangeStep
	result := 0.0

	for i := 0; i < n; i++ {
		li := 1.0
		for j := 0; j < n; j++ {
			if j != i {
				li *= (c.XS - c.X[j]) / (c.X[i] - c.X[j])
			}
		}
		term := c.Y[i] * li
		steps = append(steps, LagrangeStep{
			I:    i,
			LiX:  li,
			Yi:   c.Y[i],
			Term: term,
		})
		result += term
	}

	curveX, curveY := c.CurvePoints(300)
	return steps, result, curveX, curveY, nil
}
