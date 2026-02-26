package engine

import (
	"log/slog"

	"github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

const component = "engine"

type Task4Engine struct {
	logger  *slog.Logger
	funcStr string
	x0      float64
	epsilon float64
	maxIter int
}

func NewTask4Engine(logger *slog.Logger) (*Task4Engine, error) {
	logger = logger.With(slog.String("component", component))

	return &Task4Engine{
		logger: logger,
	}, nil
}

func (e *Task4Engine) NewtonMethod(funcStr string, x0, epsilon float64) ([]math.NewtonStep, float64, int, error) {
	const op = "newton"
	logger := e.logger.With(slog.String("op", op))

	calculator, err := math.NewNewtonMethodCalculator(funcStr, x0, epsilon)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, 0, 0, err
	}

	return calculator.Calculate()

}

func (e *Task4Engine) BisectionMethod(funcStr string, a, b, epsilon float64) ([]math.BisectionStep, float64, int, error) {
	const op = "bisection"
	logger := e.logger.With(slog.String("op", op))

	calculator, err := math.NewBisectionMethodCalculator(funcStr, a, b, epsilon)
	if err != nil {
		logger.Error("failed to create calculator", slog.Any("error", err))
		return nil, 0, 0, err
	}

	return calculator.Calculate()
}
