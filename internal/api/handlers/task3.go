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

type Task3Handler struct {
	logger *slog.Logger
	engine *engine.Task3Engine
}

func NewTask3Handler(logger *slog.Logger) *Task3Handler {
	logger = logger.With(slog.String("component", "task3_handler"))
	return &Task3Handler{
		logger: logger,
		engine: engine.NewTask3Engine(logger),
	}
}

func (h *Task3Handler) Jacobi(w http.ResponseWriter, r *http.Request) {
	var req dto.JacobiRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, eigenvalues, eigenvectors, iter, err := h.engine.JacobiMethod(req.Matrix, req.Epsilon)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.JacobiResponse{
		Eigenvalues:  eigenvalues,
		Eigenvectors: eigenvectors,
		Iterations:   iter,
		Steps:        dto.JacobiStepMapping(steps),
	})
}
