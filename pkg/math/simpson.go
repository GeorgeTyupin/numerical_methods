package math

import (
	"fmt"
	"math"

	"github.com/GeorgeTyupin/numerical_methods/pkg/math/mathutils"
	"github.com/Knetic/govaluate"
)

// SimpsonStep — одно удвоение шага метода Симпсона.
type SimpsonStep struct {
	K     int     // номер удвоения (0 = первое)
	H     float64 // шаг
	N     int     // число подотрезков (чётное)
	S     float64 // значение интеграла
	SPrev float64 // предыдущее значение (0 для k=0)
	Diff  float64 // |S - SPrev| / 15 (оценка погрешности по Рунге)
}

// SimpsonCalculator вычисляет интеграл методом Симпсона с правилом Рунге.
type SimpsonCalculator struct {
	Func    *govaluate.EvaluableExpression
	A, B    float64
	Epsilon float64
}

func NewSimpsonCalculator(funcStr string, a, b, epsilon float64) (*SimpsonCalculator, error) {
	if a >= b {
		return nil, fmt.Errorf("a должно быть меньше b")
	}
	fn, err := mathutils.ParseFormula(funcStr)
	if err != nil {
		return nil, err
	}
	return &SimpsonCalculator{Func: fn, A: a, B: b, Epsilon: epsilon}, nil
}

func (c *SimpsonCalculator) eval(x float64) float64 {
	res, _ := c.Func.Evaluate(map[string]interface{}{"x": x, "pi": math.Pi, "e": math.E})
	val, ok := res.(float64)
	if !ok {
		return math.NaN()
	}
	return val
}

// simpsonSum вычисляет композитный интеграл Симпсона с n подотрезками.
func (c *SimpsonCalculator) simpsonSum(n int) float64 {
	h := (c.B - c.A) / float64(n)
	sum := c.eval(c.A) + c.eval(c.B)
	for i := 1; i < n; i++ {
		x := c.A + float64(i)*h
		if i%2 == 0 {
			sum += 2 * c.eval(x)
		} else {
			sum += 4 * c.eval(x)
		}
	}
	return sum * h / 3
}

// Calculate выполняет метод Симпсона с удвоением шага.
// Возвращает шаги, итоговое значение, точки кривой f(x) и параболических дуг.
func (c *SimpsonCalculator) Calculate() ([]SimpsonStep, float64, []float64, []float64, []float64, []float64, error) {
	const maxIter = 20

	var steps []SimpsonStep
	n := 2 // начальное число подотрезков (чётное)
	sPrev := 0.0
	s := c.simpsonSum(n)

	steps = append(steps, SimpsonStep{K: 0, H: (c.B - c.A) / float64(n), N: n, S: s, SPrev: 0, Diff: 0})

	for k := 1; k <= maxIter; k++ {
		sPrev = s
		n *= 2
		s = c.simpsonSum(n)
		diff := math.Abs(s-sPrev) / 15.0

		steps = append(steps, SimpsonStep{
			K: k, H: (c.B - c.A) / float64(n), N: n, S: s, SPrev: sPrev, Diff: diff,
		})

		if diff < c.Epsilon {
			break
		}
		if k == maxIter {
			return steps, s, nil, nil, nil, nil, fmt.Errorf("метод Симпсона: превышено максимальное число удвоений")
		}
	}

	// Генерируем точки кривой f(x) для графика (200 точек)
	const nCurve = 200
	curveX := make([]float64, nCurve)
	curveY := make([]float64, nCurve)
	for i := range curveX {
		x := c.A + float64(i)*(c.B-c.A)/float64(nCurve-1)
		curveX[i] = x
		curveY[i] = c.eval(x)
	}

	// Генерируем параболические дуги для финального разбиения (сегменты Симпсона)
	// Каждый сегмент Simpson — пара подотрезков [x_{2k}, x_{2k+1}, x_{2k+2}]
	h := (c.B - c.A) / float64(n)
	const nArc = 10 // точек на дугу
	var segX, segY []float64
	for k := 0; k < n/2; k++ {
		x0 := c.A + float64(2*k)*h
		x1 := x0 + h
		x2 := x0 + 2*h
		f0, f1, f2 := c.eval(x0), c.eval(x1), c.eval(x2)
		// Квадратичная интерполяция через три точки
		for j := 0; j <= nArc; j++ {
			t := float64(j) / float64(nArc)
			x := x0 + 2*h*t
			// Формула Лагранжа через (x0,f0),(x1,f1),(x2,f2)
			l0 := (x - x1) * (x - x2) / ((x0 - x1) * (x0 - x2))
			l1 := (x - x0) * (x - x2) / ((x1 - x0) * (x1 - x2))
			l2 := (x - x0) * (x - x1) / ((x2 - x0) * (x2 - x1))
			y := f0*l0 + f1*l1 + f2*l2
			segX = append(segX, x)
			segY = append(segY, y)
		}
	}

	return steps, s, curveX, curveY, segX, segY, nil
}
