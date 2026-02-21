package api

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/GeorgeTyupin/numerical_methods/internal/api/handlers"
	"github.com/GeorgeTyupin/numerical_methods/internal/config"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const component = "api"

type HttpServer struct {
	logger *slog.Logger
	*http.Server
}

func NewHttpServer(logger *slog.Logger, cfg *config.Config) *HttpServer {
	logger = logger.With(slog.String("component", component))

	mux := registerRoutes()

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

func registerRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	fs := http.FileServer(http.Dir("static"))
	r.Handle("/static/*", http.StripPrefix("/static/", fs))

	r.Get("/", handlers.Index)

	r.Route("/api/v1/calculate", func(r chi.Router) {
		r.Route("/task4", func(r chi.Router) {
			r.Post("/bisection", handlers.Bisection)
			r.Post("/newton", handlers.Newton)
			r.Post("/simple_iter", handlers.SimpleIter)
		})
	})

	return r
}
