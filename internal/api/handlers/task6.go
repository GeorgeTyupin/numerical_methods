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

type Task6Handler struct {
	logger *slog.Logger
	engine *engine.Task6Engine
}

func NewTask6Handler(logger *slog.Logger) *Task6Handler {
	logger = logger.With(slog.String("component", "task6_handler"))
	return &Task6Handler{
		logger: logger,
		engine: engine.NewTask6Engine(logger),
	}
}

func (h *Task6Handler) CubicSpline(w http.ResponseWriter, r *http.Request) {
	var req dto.SplineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	segments, curveX, curveY, err := h.engine.CubicSplineMethod(req.X, req.Y)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.SplineResponse{
		Segments: dto.SplineSegmentMapping(segments),
		CurveX:   curveX,
		CurveY:   curveY,
	})
}
