package api

import (
	"log/slog"
	"net/http"

	"github.com/GeorgeTyupin/numerical_methods/internal/api/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func RegisterRoutes(logger *slog.Logger) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	fs := http.FileServer(http.Dir("static"))
	r.Handle("/static/*", http.StripPrefix("/static/", fs))

	r.Get("/", handlers.Index)

	r.Route("/api/v1/calculate", func(r chi.Router) {
		task4 := handlers.NewTask4Handler(logger)

		r.Route("/task4", func(r chi.Router) {
			r.Post("/dichotomy", task4.Dichotomy)
			r.Post("/newton", task4.Newton)
			r.Post("/simple_iter", task4.SimpleIter)
		})
	})

	return r
}
