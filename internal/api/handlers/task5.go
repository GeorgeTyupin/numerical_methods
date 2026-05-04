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

type Task5Handler struct {
	logger *slog.Logger
	engine *engine.Task5Engine
}

func NewTask5Handler(logger *slog.Logger) *Task5Handler {
	logger = logger.With(slog.String("component", "task5_handler"))
	return &Task5Handler{
		logger: logger,
		engine: engine.NewTask5Engine(logger),
	}
}

func (h *Task5Handler) Lagrange(w http.ResponseWriter, r *http.Request) {
	var req dto.InterpolationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, value, curveX, curveY, err := h.engine.LagrangeMethod(req.X, req.Y, req.XS)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.LagrangeResponse{
		Value:  value,
		CurveX: curveX,
		CurveY: curveY,
		Steps:  dto.LagrangeStepMapping(steps),
	})
}

func (h *Task5Handler) Newton(w http.ResponseWriter, r *http.Request) {
	var req dto.InterpolationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, value, curveX, curveY, err := h.engine.NewtonInterpMethod(req.X, req.Y, req.XS)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.NewtonInterpResponse{
		Value:  value,
		CurveX: curveX,
		CurveY: curveY,
		Steps:  dto.NewtonInterpStepMapping(steps),
	})
}
