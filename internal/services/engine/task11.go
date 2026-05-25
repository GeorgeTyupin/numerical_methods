package engine

import (
	"log/slog"

	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task11Engine struct {
	logger *slog.Logger
}

func NewTask11Engine(logger *slog.Logger) *Task11Engine {
	return &Task11Engine{logger: logger.With(slog.String("component", "task11_engine"))}
}

func (e *Task11Engine) BVPMethod(
	p, q, f string,
	a, b float64,
	alphaA, betaA, gammaA float64,
	alphaB, betaB, gammaB float64,
	h float64,
) ([]gomath.BVPStep, []float64, []float64, error) {
	calc, err := gomath.NewBVPCalculator(p, q, f, a, b, alphaA, betaA, gammaA, alphaB, betaB, gammaB, h)
	if err != nil {
		e.logger.Error("failed to create BVP calculator", slog.Any("error", err))
		return nil, nil, nil, err
	}
	return calc.Calculate()
}
