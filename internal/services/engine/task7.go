package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task7Engine struct {
	logger *slog.Logger
}

func NewTask7Engine(logger *slog.Logger) *Task7Engine {
	return &Task7Engine{logger: logger.With(slog.String("component", "task7_engine"))}
}

func (e *Task7Engine) LSSMethod(x, y []float64) ([]gomath.LSSStep, []float64, []float64, error) {
	calc, err := gomath.NewLSSCalculator(x, y)
	if err != nil {
		e.logger.Error("failed to create LSS calculator", slog.Any("error", err))
		return nil, nil, nil, err
	}
	return calc.Calculate()
}
