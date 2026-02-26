package math

import (
	"fmt"
	"math"

	"github.com/GeorgeTyupin/numerical_methods/pkg/math/mathutils"
	"github.com/Knetic/govaluate"
	"gonum.org/v1/gonum/diff/fd"
)

// Максимальное количество итераций
// Зашиваем жесткий предел, чтобы защитить сервер от зависания
// на нерешаемых уравнениях.
const maxIter = 10000

type NewtonStep struct {
	XPrev float64
	XNew  float64
	Fx    float64
}

type NewtonMethodCalculator struct {
	// Функция f(x), которую мы решаем
	Func *govaluate.EvaluableExpression

	// Начальное приближение x0
	X0 float64

	// Требуемая точность (epsilon)
	Epsilon float64

	// Ограничитель итераций, чтобы сервер не зависал, если корень не сходится
	MaxIter int
}

// NewNewtonMethodCalculator создает новый экземпляр NewtonMethodCalculator
// reqFunc - функция в виде строки, например "x^3 - 2*x - 5"
// x0 - начальное приближение
// epsilon - требуемая точность
func NewNewtonMethodCalculator(reqFunc string, x0 float64, epsilon float64) (*NewtonMethodCalculator, error) {
	fn, err := mathutils.ParseFormula(reqFunc)
	if err != nil {
		return nil, err
	}

	return &NewtonMethodCalculator{
		Func:    fn,
		X0:      x0,
		Epsilon: epsilon,
	}, nil
}

// eval вычисляет значение функции в точке x
func (c *NewtonMethodCalculator) eval(x float64) float64 {
	res, _ := c.Func.Evaluate(map[string]interface{}{"x": x, "pi": math.Pi, "e": math.E})
	val, ok := res.(float64)
	if !ok {
		return math.NaN()
	}
	return val
}

// Calculate возвращает шаги алгоритма, корень, количество итераций и ошибку
func (c *NewtonMethodCalculator) Calculate() ([]NewtonStep, float64, int, error) {
	var steps []NewtonStep
	x := c.X0

	// Цикл для вычисления корня
	for i := 1; i <= maxIter; i++ {
		// Вычисляем значение функции в точке x
		fx := c.eval(x)
		if math.IsNaN(fx) || math.IsInf(fx, 0) {
			return steps, 0, i, fmt.Errorf("ошибка вычисления функции в точке x=%v", x)
		}

		// Вычисляем производную численно в точке x
		dfx := fd.Derivative(c.eval, x, &fd.Settings{Formula: fd.Central})
		// Проверка на ноль. Сверяем с 1e-10, потому что в float64 могут быть погрешности
		if math.Abs(dfx) < 1e-10 {
			return steps, 0, i, fmt.Errorf("производная равна нулю в точке x=%v", x)
		}

		xNew := x - fx/dfx
		steps = append(steps, NewtonStep{XPrev: x, XNew: xNew, Fx: fx})

		// Проверка на точность
		if math.Abs(xNew-x) < c.Epsilon {
			return steps, xNew, i, nil
		}
		x = xNew
	}

	return steps, x, maxIter, fmt.Errorf("превышено максимальное количество итераций")
}
