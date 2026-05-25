package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task10Engine struct {
	logger *slog.Logger
}

func NewTask10Engine(logger *slog.Logger) *Task10Engine {
	return &Task10Engine{logger: logger.With(slog.String("component", "task10_engine"))}
}

func (e *Task10Engine) CauchyMethod(formula string, x0, y0, xEnd, h float64) ([]gomath.CauchyStep, error) {
	calc, err := gomath.NewCauchyCalculator(formula, x0, y0, xEnd, h)
	if err != nil {
		e.logger.Error("failed to create cauchy calculator", slog.Any("error", err))
		return nil, err
	}
	return calc.Calculate()
}
