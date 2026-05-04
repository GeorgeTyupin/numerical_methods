package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task6Engine struct {
	logger *slog.Logger
}

func NewTask6Engine(logger *slog.Logger) *Task6Engine {
	return &Task6Engine{logger: logger.With(slog.String("component", "task6_engine"))}
}

func (e *Task6Engine) CubicSplineMethod(x, y []float64) ([]gomath.SplineSegment, []float64, []float64, error) {
	const op = "cubic_spline"
	logger := e.logger.With(slog.String("op", op))

	calc, err := gomath.NewCubicSplineCalculator(x, y)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, nil, nil, err
	}
	return calc.Calculate()
}
