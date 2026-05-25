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

type Task10Handler struct {
	logger *slog.Logger
	engine *engine.Task10Engine
}

func NewTask10Handler(logger *slog.Logger) *Task10Handler {
	logger = logger.With(slog.String("component", "task10_handler"))
	return &Task10Handler{
		logger: logger,
		engine: engine.NewTask10Engine(logger),
	}
}

func (h *Task10Handler) Cauchy(w http.ResponseWriter, r *http.Request) {
	var req dto.CauchyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, err := h.engine.CauchyMethod(req.Formula, req.X0, req.Y0, req.XEnd, req.H)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.CauchyResponse{
		Steps: dto.CauchyStepMapping(steps),
	})
}
