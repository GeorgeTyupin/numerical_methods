package api

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/GeorgeTyupin/numerical_methods/internal/config"
)

const component = "api"

type HttpServer struct {
	logger *slog.Logger
	*http.Server
}

func NewHttpServer(logger *slog.Logger, cfg *config.Config) *HttpServer {
	logger = logger.With(slog.String("component", component))

	mux := RegisterRoutes()

	server := &http.Server{
		Addr:    cfg.Server.Port,
		Handler: mux,
	}

	return &HttpServer{
		logger: logger,
		Server: server,
	}
}

func (s *HttpServer) Run() error {
	const op = "Run"
	logger := s.logger.With(slog.String("op", op))

	logger.Info("запуск сервера", slog.String("addr", s.Server.Addr))
	return s.Server.ListenAndServe()
}

func (s *HttpServer) Stop(ctx context.Context) error {
	const op = "Stop"
	logger := s.logger.With(slog.String("op", op))

	logger.Info("остановка сервера")
	if err := s.Server.Shutdown(ctx); err != nil {
		return err
	}

	return nil
}
