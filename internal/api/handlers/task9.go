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

type Task9Handler struct {
	logger *slog.Logger
	engine *engine.Task9Engine
}

func NewTask9Handler(logger *slog.Logger) *Task9Handler {
	logger = logger.With(slog.String("component", "task9_handler"))
	return &Task9Handler{
		logger: logger,
		engine: engine.NewTask9Engine(logger),
	}
}

func (h *Task9Handler) Simpson(w http.ResponseWriter, r *http.Request) {
	var req dto.SimpsonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, integral, curveX, curveY, segX, segY, err := h.engine.SimpsonMethod(
		req.Formula, req.A, req.B, req.Epsilon)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.SimpsonResponse{
		Integral: integral,
		Steps:    dto.SimpsonStepMapping(steps),
		CurveX:   curveX,
		CurveY:   curveY,
		SegX:     segX,
		SegY:     segY,
	})
}
