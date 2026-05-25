package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task8Engine struct {
	logger *slog.Logger
}

func NewTask8Engine(logger *slog.Logger) *Task8Engine {
	return &Task8Engine{logger: logger.With(slog.String("component", "task8_engine"))}
}

func (e *Task8Engine) DiffMethod(x, y []float64) ([]gomath.DiffStep, error) {
	calc, err := gomath.NewDiffCalculator(x, y)
	if err != nil {
		e.logger.Error("failed to create diff calculator", slog.Any("error", err))
		return nil, err
	}
	return calc.Calculate()
}
