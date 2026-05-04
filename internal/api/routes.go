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
		task1 := handlers.NewTask1Handler(logger)
		r.Route("/task1", func(r chi.Router) {
			r.Post("/gauss", task1.Gauss)
			r.Post("/simple_iter", task1.SimpleIter)
		})

		task2 := handlers.NewTask2Handler(logger)
		r.Route("/task2", func(r chi.Router) {
			r.Post("/tridiagonal", task2.Tridiagonal)
			r.Post("/seidel", task2.Seidel)
		})

		task3 := handlers.NewTask3Handler(logger)
		r.Route("/task3", func(r chi.Router) {
			r.Post("/jacobi", task3.Jacobi)
		})

		task4 := handlers.NewTask4Handler(logger)
		r.Route("/task4", func(r chi.Router) {
			r.Post("/dichotomy", task4.Dichotomy)
			r.Post("/newton", task4.Newton)
			r.Post("/simple_iter", task4.SimpleIter)
		})

		task5 := handlers.NewTask5Handler(logger)
		r.Route("/task5", func(r chi.Router) {
			r.Post("/lagrange", task5.Lagrange)
			r.Post("/newton", task5.Newton)
		})

		task6 := handlers.NewTask6Handler(logger)
		r.Route("/task6", func(r chi.Router) {
			r.Post("/cubic_spline", task6.CubicSpline)
		})
	})

	return r
}
