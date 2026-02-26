package math

import (
	"fmt"
	"math"

	"github.com/GeorgeTyupin/numerical_methods/pkg/math/mathutils"
	"github.com/Knetic/govaluate"
)

type SimpleIterStep struct {
	XPrev float64
	XNew  float64
	Fx    float64
}

type SimpleIterationMethodCalculator struct {
	Func    *govaluate.EvaluableExpression
	X0      float64
	Epsilon float64
}

func NewSimpleIterationMethodCalculator(funcStr string, x0, epsilon float64) (*SimpleIterationMethodCalculator, error) {
	fn, err := mathutils.ParseFormula(funcStr)
	if err != nil {
		return nil, err
	}

	return &SimpleIterationMethodCalculator{
		Func:    fn,
		X0:      x0,
		Epsilon: epsilon,
	}, nil
}

func (c *SimpleIterationMethodCalculator) eval(x float64) float64 {
	res, _ := c.Func.Evaluate(map[string]interface{}{"x": x, "pi": math.Pi, "e": math.E})
	val, ok := res.(float64)
	if !ok {
		return math.NaN()
	}
	return val
}

func (c *SimpleIterationMethodCalculator) Calculate() ([]SimpleIterStep, float64, int, error) {
	var steps []SimpleIterStep

	// Начальное приближение
	xPrev := c.X0

	for i := 1; i <= maxIter; i++ {
		// Вычисляем новое приближение
		xNew := c.eval(xPrev)

		if math.IsNaN(xNew) || math.IsInf(xNew, 0) {
			return steps, 0, i, fmt.Errorf("ошибка: значение ушло в бесконечность (расходится) на x=%v", xPrev)
		}

		// Разница для проверки условия сходимости
		diff := math.Abs(xNew - xPrev)

		steps = append(steps, SimpleIterStep{XPrev: xPrev, XNew: xNew, Fx: diff})

		// Условие остановки: расстояние между точками меньше либо равно эпсилон
		if diff <= c.Epsilon {
			return steps, xNew, i, nil
		}

		xPrev = xNew
	}

	return steps, 0, maxIter, fmt.Errorf("превышено максимальное количество итераций")
}
