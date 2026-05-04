package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task3Engine struct {
	logger *slog.Logger
}

func NewTask3Engine(logger *slog.Logger) *Task3Engine {
	return &Task3Engine{logger: logger.With(slog.String("component", "task3_engine"))}
}

func (e *Task3Engine) JacobiMethod(matrix [][]float64, epsilon float64) ([]gomath.JacobiStep, []float64, [][]float64, int, error) {
	const op = "jacobi"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewJacobiCalculator(matrix, epsilon)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, nil, nil, 0, err
	}
	return calc.Calculate()
}
