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

type Task11Handler struct {
	logger *slog.Logger
	engine *engine.Task11Engine
}

func NewTask11Handler(logger *slog.Logger) *Task11Handler {
	logger = logger.With(slog.String("component", "task11_handler"))
	return &Task11Handler{
		logger: logger,
		engine: engine.NewTask11Engine(logger),
	}
}

func (h *Task11Handler) BVP(w http.ResponseWriter, r *http.Request) {
	var req dto.BVPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, x, solution, err := h.engine.BVPMethod(
		req.P, req.Q, req.F,
		req.A, req.B,
		req.AlphaA, req.BetaA, req.GammaA,
		req.AlphaB, req.BetaB, req.GammaB,
		req.H,
	)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.BVPResponse{
		Solution: solution,
		X:        x,
		Steps:    dto.BVPStepMapping(steps),
	})
}
