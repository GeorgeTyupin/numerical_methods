package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task1Engine struct {
	logger *slog.Logger
}

func NewTask1Engine(logger *slog.Logger) *Task1Engine {
	return &Task1Engine{logger: logger.With(slog.String("component", "task1_engine"))}
}

func (e *Task1Engine) GaussMethod(matrix [][]float64, vector []float64) ([]gomath.GaussStep, []float64, error) {
	const op = "gauss"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewGaussCalculator(matrix, vector)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, nil, err
	}
	return calc.Calculate()
}

func (e *Task1Engine) SimpleIterSLAUMethod(matrix [][]float64, vector []float64, epsilon float64) ([]gomath.SimpleIterSLAUStep, []float64, int, error) {
	const op = "simple_iter_slau"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewSimpleIterSLAUCalculator(matrix, vector, epsilon)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, nil, 0, err
	}
	return calc.Calculate()
}
