package dto

import "github.com/GeorgeTyupin/numerical_methods/pkg/math"

// BaseRequest содержит общие поля для всех методов поиска корней
type BaseRequest struct {
	Formula string  `json:"formula"` // Функция, например "x^3 - 2*x - 5"
	Epsilon float64 `json:"epsilon"` // Требуемая точность
}

// BaseResponse содержит общие поля ответа для графиков
type BaseResponse struct {
	Root       float64 `json:"root"`       // Найденный корень уравнения
	Iterations int     `json:"iterations"` // Затраченное количество итераций
	Error      float64 `json:"error"`      // Итоговая погрешность
}

// ============================================
// Метод Дихотомии (Bisection)
// ============================================

type BisectionRequest struct {
	BaseRequest
	A float64 `json:"a"` // Левая граница
	B float64 `json:"b"` // Правая граница
}

type BisectionStep struct {
	A float64 `json:"a"` // Левая граница отрезка на текущем шаге
	B float64 `json:"b"` // Правая граница отрезка на текущем шаге
	C float64 `json:"c"` // Середина отрезка на текущем шаге
}

type BisectionResponse struct {
	BaseResponse
	Steps []BisectionStep `json:"steps"`
}

func BisectionStepMapping(steps []math.BisectionStep) []BisectionStep {
	bisectionSteps := make([]BisectionStep, len(steps))
	for i, step := range steps {
		bisectionSteps[i] = BisectionStep{
			A: step.A,
			B: step.B,
		}
	}
	return bisectionSteps
}

// ============================================
// Метод Ньютона (Newton)
// ============================================

type NewtonRequest struct {
	BaseRequest
	X0 float64 `json:"x0"` // Начальное приближение
}

type NewtonStep struct {
	XPrev float64 `json:"x_prev"` // Текущий x_n
	XNew  float64 `json:"x_new"`  // Вычисленный x_n+1
	Fx    float64 `json:"fx"`     // Значение f(x_prev)
}

// NewtonStepMapping конвертирует []math.NewtonStep в []NewtonStep
func NewtonStepMapping(steps []math.NewtonStep) []NewtonStep {
	newtonSteps := make([]NewtonStep, len(steps))
	for i, step := range steps {
		newtonSteps[i] = NewtonStep{
			XPrev: step.XPrev,
			XNew:  step.XNew,
			Fx:    step.Fx,
		}
	}
	return newtonSteps
}

type NewtonResponse struct {
	BaseResponse
	Steps []NewtonStep `json:"steps"`
}

// ============================================
// Метод Простой Итерации (Simple Iteration)
// ============================================

type SimpleIterRequest struct {
	BaseRequest
	X0 float64 `json:"x0"` // Начальное приближение
}

type SimpleIterStep struct {
	XPrev float64 `json:"x_prev"` // Текущий x_n
	XNew  float64 `json:"x_new"`  // Вычисленный x_n+1 (результат phi(x))
	Fx    float64 `json:"fx"`     // Значение функции (можно передавать, если нужно для построения на графике, или опустить)
}

type SimpleIterResponse struct {
	BaseResponse
	Steps []SimpleIterStep `json:"steps"`
}
