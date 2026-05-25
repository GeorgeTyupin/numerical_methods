package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task9Engine struct {
	logger *slog.Logger
}

func NewTask9Engine(logger *slog.Logger) *Task9Engine {
	return &Task9Engine{logger: logger.With(slog.String("component", "task9_engine"))}
}

func (e *Task9Engine) SimpsonMethod(formula string, a, b, epsilon float64) (
	[]gomath.SimpsonStep, float64, []float64, []float64, []float64, []float64, error) {
	calc, err := gomath.NewSimpsonCalculator(formula, a, b, epsilon)
	if err != nil {
		e.logger.Error("failed to create simpson calculator", slog.Any("error", err))
		return nil, 0, nil, nil, nil, nil, err
	}
	return calc.Calculate()
}
