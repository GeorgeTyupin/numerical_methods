package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task5Engine struct {
	logger *slog.Logger
}

func NewTask5Engine(logger *slog.Logger) *Task5Engine {
	return &Task5Engine{logger: logger.With(slog.String("component", "task5_engine"))}
}

func (e *Task5Engine) LagrangeMethod(x, y []float64, xs float64) ([]gomath.LagrangeStep, float64, []float64, []float64, error) {
	const op = "lagrange"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewLagrangeCalculator(x, y, xs)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, 0, nil, nil, err
	}
	return calc.Calculate()
}

func (e *Task5Engine) NewtonInterpMethod(x, y []float64, xs float64) ([]gomath.NewtonInterpStep, float64, []float64, []float64, error) {
	const op = "newton_interp"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewNewtonInterpCalculator(x, y, xs)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, 0, nil, nil, err
	}
	return calc.Calculate()
}
