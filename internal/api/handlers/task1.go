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

type Task1Handler struct {
	logger *slog.Logger
	engine *engine.Task1Engine
}

func NewTask1Handler(logger *slog.Logger) *Task1Handler {
	logger = logger.With(slog.String("component", "task1_handler"))
	return &Task1Handler{
		logger: logger,
		engine: engine.NewTask1Engine(logger),
	}
}

func (h *Task1Handler) Gauss(w http.ResponseWriter, r *http.Request) {
	var req dto.GaussRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, solution, err := h.engine.GaussMethod(req.Matrix, req.Vector)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.GaussResponse{
		Solution: solution,
		Steps:    dto.GaussStepMapping(steps),
	})
}

func (h *Task1Handler) SimpleIter(w http.ResponseWriter, r *http.Request) {
	var req dto.SimpleIterSLAURequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, solution, iter, err := h.engine.SimpleIterSLAUMethod(req.Matrix, req.Vector, req.Epsilon)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.SimpleIterSLAUResponse{
		Solution:   solution,
		Iterations: iter,
		Steps:      dto.SimpleIterSLAUStepMapping(steps),
	})
}
