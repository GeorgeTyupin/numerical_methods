package api

import (
	"net/http"

	"github.com/GeorgeTyupin/numerical_methods/internal/api/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func RegisterRoutes() *chi.Mux {
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
