package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/GeorgeTyupin/numerical_methods/internal/api/handlers/dto"
	"github.com/GeorgeTyupin/numerical_methods/internal/api/handlers/handutils"
	errs "github.com/GeorgeTyupin/numerical_methods/internal/errors"
	"github.com/GeorgeTyupin/numerical_methods/internal/services/engine"
)

type Task2Handler struct {
	logger *slog.Logger
	engine *engine.Task2Engine
}

func NewTask2Handler(logger *slog.Logger) *Task2Handler {
	logger = logger.With(slog.String("component", "task2_handler"))
	return &Task2Handler{
		logger: logger,
		engine: engine.NewTask2Engine(logger),
	}
}

func (h *Task2Handler) Tridiagonal(w http.ResponseWriter, r *http.Request) {
	var req dto.TridiagonalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, solution, err := h.engine.TridiagonalMethod(req.A, req.B, req.C, req.D)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.TridiagonalResponse{
		Solution: solution,
		Steps:    dto.TridiagonalStepMapping(steps),
	})
}

func (h *Task2Handler) Seidel(w http.ResponseWriter, r *http.Request) {
	var req dto.SeidelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, solution, iter, err := h.engine.SeidelMethod(req.Matrix, req.Vector, req.Epsilon)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.SeidelResponse{
		Solution:   solution,
		Iterations: iter,
		Steps:      dto.SeidelStepMapping(steps),
	})
}
