package math

import (
	"fmt"
)

// NewtonInterpStep — одна строка таблицы разделённых разностей
type NewtonInterpStep struct {
	Order  int
	Values []float64
}

type NewtonInterpCalculator struct {
	X  []float64
	Y  []float64
	XS float64
}

func NewNewtonInterpCalculator(x, y []float64, xs float64) (*NewtonInterpCalculator, error) {
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
	return &NewtonInterpCalculator{
		X:  append([]float64{}, x...),
		Y:  append([]float64{}, y...),
		XS: xs,
	}, nil
}

func (c *NewtonInterpCalculator) buildDivDiff() [][]float64 {
	n := len(c.X)
	dd := make([][]float64, n)
	for i := range dd {
		dd[i] = make([]float64, n)
		dd[i][0] = c.Y[i]
	}
	for j := 1; j < n; j++ {
		for i := 0; i < n-j; i++ {
			dd[i][j] = (dd[i+1][j-1] - dd[i][j-1]) / (c.X[i+j] - c.X[i])
		}
	}
	return dd
}

func (c *NewtonInterpCalculator) evalAt(xv float64, dd [][]float64) float64 {
	n := len(c.X)
	result := dd[0][0]
	term := 1.0
	for j := 1; j < n; j++ {
		term *= (xv - c.X[j-1])
		result += dd[0][j] * term
	}
	return result
}

func (c *NewtonInterpCalculator) CurvePoints(numPoints int) ([]float64, []float64) {
	dd := c.buildDivDiff()
	if numPoints < 2 {
		numPoints = 200
	}
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
		ys[i] = c.evalAt(xv, dd)
	}
	return xs, ys
}

func (c *NewtonInterpCalculator) Calculate() ([]NewtonInterpStep, float64, []float64, []float64, error) {
	n := len(c.X)
	dd := c.buildDivDiff()

	var steps []NewtonInterpStep
	// Сохраняем каждый порядок разделённых разностей
	for j := 0; j < n; j++ {
		vals := make([]float64, n-j)
		for i := 0; i < n-j; i++ {
			vals[i] = dd[i][j]
		}
		steps = append(steps, NewtonInterpStep{Order: j, Values: vals})
	}

	result := c.evalAt(c.XS, dd)
	curveX, curveY := c.CurvePoints(300)
	return steps, result, curveX, curveY, nil
}
