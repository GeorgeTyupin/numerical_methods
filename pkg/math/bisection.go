package math

import (
	"fmt"
	"math"

	"github.com/GeorgeTyupin/numerical_methods/pkg/math/mathutils"
	"github.com/Knetic/govaluate"
)

type BisectionStep struct {
	A float64
	B float64
}

type BisectionMethodCalculator struct {
	Func    *govaluate.EvaluableExpression
	A       float64
	B       float64
	Epsilon float64
	MaxIter int
}

func NewBisectionMethodCalculator(funcStr string, a, b, epsilon float64) (*BisectionMethodCalculator, error) {
	fn, err := mathutils.ParseFormula(funcStr)
	if err != nil {
		return nil, err
	}

	return &BisectionMethodCalculator{
		Func:    fn,
		A:       a,
		B:       b,
		Epsilon: epsilon,
		MaxIter: maxIter,
	}, nil
}

// eval вычисляет значение функции в точке x
func (c *BisectionMethodCalculator) eval(x float64) float64 {
	res, _ := c.Func.Evaluate(map[string]interface{}{"x": x, "pi": math.Pi, "e": math.E})
	val, ok := res.(float64)
	if !ok {
		return math.NaN()
	}
	return val
}

func (c *BisectionMethodCalculator) Calculate() ([]BisectionStep, float64, int, error) {
	var steps []BisectionStep
	a := c.A
	b := c.B

	// Вычисляем значение функции на концах отрезка
	fa := c.eval(a)
	fb := c.eval(b)

	if math.IsNaN(fa) || math.IsInf(fa, 0) {
		return steps, 0, 0, fmt.Errorf("ошибка вычисления функции в точке a=%v", a)
	}
	if math.IsNaN(fb) || math.IsInf(fb, 0) {
		return steps, 0, 0, fmt.Errorf("ошибка вычисления функции в точке b=%v", b)
	}

	// Проверяем, что функция имеет разные знаки на концах отрезка
	if fa*fb > 0 {
		return steps, 0, 0, fmt.Errorf("функция имеет одинаковые знаки на концах отрезка")
	}

	// Цикл для вычисления корня
	for i := 1; i <= c.MaxIter; i++ {
		// Вычисляем середину отрезка
		mid := (a + b) / 2.0
		fmid := c.eval(mid)

		if math.IsNaN(fmid) || math.IsInf(fmid, 0) {
			return steps, 0, i, fmt.Errorf("ошибка вычисления функции в точке x=%v", mid)
		}

		// Записываем шаг для фронтенда
		steps = append(steps, BisectionStep{A: a, B: b})

		// Проверка на точность или точное попадание в корень
		if math.Abs(b-a) < c.Epsilon || fmid == 0 {
			return steps, mid, i, nil
		}

		// Сужение отрезка
		if fa*fmid <= 0 {
			// Корень в левой половине
			b = mid
		} else {
			// Корень в правой половине
			a = mid
			fa = fmid
		}
	}

	return steps, 0, c.MaxIter, fmt.Errorf("превышено максимальное количество итераций")
}
