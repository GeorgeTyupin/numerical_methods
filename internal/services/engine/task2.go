package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task2Engine struct {
	logger *slog.Logger
}

func NewTask2Engine(logger *slog.Logger) *Task2Engine {
	return &Task2Engine{logger: logger.With(slog.String("component", "task2_engine"))}
}

func (e *Task2Engine) TridiagonalMethod(a, b, c, d []float64) ([]gomath.TridiagonalStep, []float64, error) {
	const op = "tridiagonal"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewTridiagonalCalculator(a, b, c, d)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, nil, err
	}
	return calc.Calculate()
}

func (e *Task2Engine) SeidelMethod(matrix [][]float64, vector []float64, epsilon float64) ([]gomath.SeidelStep, []float64, int, error) {
	const op = "seidel"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewSeidelCalculator(matrix, vector, epsilon)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, nil, 0, err
	}
	return calc.Calculate()
}
