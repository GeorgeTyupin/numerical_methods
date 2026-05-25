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

type Task8Handler struct {
	logger *slog.Logger
	engine *engine.Task8Engine
}

func NewTask8Handler(logger *slog.Logger) *Task8Handler {
	logger = logger.With(slog.String("component", "task8_handler"))
	return &Task8Handler{
		logger: logger,
		engine: engine.NewTask8Engine(logger),
	}
}

func (h *Task8Handler) Diff(w http.ResponseWriter, r *http.Request) {
	var req dto.DiffRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, err := h.engine.DiffMethod(req.X, req.Y)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.DiffResponse{
		Steps: dto.DiffStepMapping(steps),
	})
}
