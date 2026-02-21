package engine

import "log/slog"

const component = "engine"

type Engine struct {
	logger *slog.Logger
}

func NewEngine(logger *slog.Logger) *Engine {
	logger = logger.With(slog.String("component", component))

	return &Engine{
		logger: logger,
	}
}
