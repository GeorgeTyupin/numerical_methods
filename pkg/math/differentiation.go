package math

import (
	"fmt"
	"math"
)

// DiffStep — производные в одном узловом значении.
type DiffStep struct {
	I       int
	X       float64
	Y       float64
	DY1     float64 // первая производная
	DY2     float64 // вторая производная
	Formula string  // "forward3" | "central" | "backward3"
}

// DiffCalculator вычисляет численные производные по таблице значений.
type DiffCalculator struct {
	X []float64
	Y []float64
}

func NewDiffCalculator(x, y []float64) (*DiffCalculator, error) {
	if len(x) != len(y) {
		return nil, fmt.Errorf("длины x и y должны совпадать")
	}
	if len(x) < 3 {
		return nil, fmt.Errorf("нужно минимум 3 точки")
	}
	// Проверяем равномерность шага
	h := x[1] - x[0]
	if math.Abs(h) < 1e-12 {
		return nil, fmt.Errorf("нулевой шаг между точками")
	}
	for i := 1; i < len(x)-1; i++ {
		if math.Abs((x[i+1]-x[i])-h) > 1e-9*math.Abs(h) {
			return nil, fmt.Errorf("шаг между точками должен быть равномерным (разница в позиции %d)", i)
		}
	}
	return &DiffCalculator{X: x, Y: y}, nil
}

// Calculate возвращает шаги дифференцирования (по одному на каждый узел).
func (c *DiffCalculator) Calculate() ([]DiffStep, error) {
	n := len(c.X)
	h := c.X[1] - c.X[0]
	steps := make([]DiffStep, n)

	for i := 0; i < n; i++ {
		var dy1, dy2 float64
		var formula string

		switch {
		case i == 0:
			// Правосторонняя 3-точечная формула
			dy1 = (-3*c.Y[0] + 4*c.Y[1] - c.Y[2]) / (2 * h)
			dy2 = (c.Y[0] - 2*c.Y[1] + c.Y[2]) / (h * h)
			formula = "forward3"
		case i == n-1:
			// Левосторонняя 3-точечная формула
			dy1 = (c.Y[n-3] - 4*c.Y[n-2] + 3*c.Y[n-1]) / (2 * h)
			dy2 = (c.Y[n-3] - 2*c.Y[n-2] + c.Y[n-1]) / (h * h)
			formula = "backward3"
		default:
			// Центральные разности
			dy1 = (c.Y[i+1] - c.Y[i-1]) / (2 * h)
			dy2 = (c.Y[i+1] - 2*c.Y[i] + c.Y[i-1]) / (h * h)
			formula = "central"
		}

		steps[i] = DiffStep{
			I:       i,
			X:       c.X[i],
			Y:       c.Y[i],
			DY1:     dy1,
			DY2:     dy2,
			Formula: formula,
		}
	}
	return steps, nil
}
