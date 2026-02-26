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

const component = "task4_handler"

type Task4Handler struct {
	logger *slog.Logger
	engine *engine.Task4Engine
}

func NewTask4Handler(logger *slog.Logger) *Task4Handler {
	logger = logger.With(slog.String("component", component))
	engine, err := engine.NewTask4Engine(logger)
	if err != nil {
		logger.Error("failed to create engine", slog.Any("error", err))
		return nil
	}

	return &Task4Handler{logger: logger, engine: engine}
}

func (h *Task4Handler) Newton(w http.ResponseWriter, r *http.Request) {
	var req dto.NewtonRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, res, iter, err := h.engine.NewtonMethod(
		req.Formula,
		req.X0,
		req.Epsilon,
	)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp := dto.NewtonResponse{
		Steps: dto.NewtonStepMapping(steps),
		BaseResponse: dto.BaseResponse{
			Root:       res,
			Iterations: iter,
		},
	}

	handutils.RespondWithJSON(w, http.StatusOK, resp)
}

func (h *Task4Handler) Dichotomy(w http.ResponseWriter, r *http.Request) {
	var req dto.DichotomyRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, res, iter, err := h.engine.DichotomyMethod(
		req.Formula,
		req.A,
		req.B,
		req.Epsilon,
	)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp := dto.DichotomyResponse{
		Steps: dto.DichotomyStepMapping(steps),
		BaseResponse: dto.BaseResponse{
			Root:       res,
			Iterations: iter,
		},
	}

	handutils.RespondWithJSON(w, http.StatusOK, resp)
}

func (h *Task4Handler) SimpleIter(w http.ResponseWriter, r *http.Request) {
	var req dto.SimpleIterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
}
