package handlers

import (
	"encoding/json"
	"log/slog"
	"math"
	"net/http"

	"github.com/GeorgeTyupin/numerical_methods/internal/api/handlers/dto"
	"github.com/GeorgeTyupin/numerical_methods/internal/api/handlers/handutils"
	errs "github.com/GeorgeTyupin/numerical_methods/internal/errors"
	"github.com/GeorgeTyupin/numerical_methods/internal/services/engine"
	gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"
)

type Task7Handler struct {
	logger *slog.Logger
	engine *engine.Task7Engine
}

func NewTask7Handler(logger *slog.Logger) *Task7Handler {
	logger = logger.With(slog.String("component", "task7_handler"))
	return &Task7Handler{
		logger: logger,
		engine: engine.NewTask7Engine(logger),
	}
}

func (h *Task7Handler) LSS(w http.ResponseWriter, r *http.Request) {
	var req dto.LSSRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, errs.ErrInvalidJSON.Error())
		return
	}

	steps, coeffsLin, coeffsQuad, err := h.engine.LSSMethod(req.X, req.Y)
	if err != nil {
		handutils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Диапазон данных для кривых
	xMin, xMax := req.X[0], req.X[0]
	for _, x := range req.X {
		if x < xMin { xMin = x }
		if x > xMax { xMax = x }
	}
	// Небольшой отступ
	pad := (xMax - xMin) * 0.1
	xMin -= pad; xMax += pad

	curveX, curveYLin := gomath.GenerateCurve(coeffsLin, xMin, xMax)
	_, curveYQuad := gomath.GenerateCurve(coeffsQuad, xMin, xMax)

	// Вычисляем остатки для линейного многочлена
	residuals := make([]float64, len(req.X))
	for i, x := range req.X {
		yHat := 0.0
		for d, c := range coeffsLin {
			yHat += c * math.Pow(x, float64(d))
		}
		residuals[i] = math.Abs(req.Y[i] - yHat)
	}

	handutils.RespondWithJSON(w, http.StatusOK, dto.LSSResponse{
		CoeffsLinear: coeffsLin,
		CoeffsQuad:   coeffsQuad,
		CurveX:       curveX,
		CurveYLinear: curveYLin,
		CurveYQuad:   curveYQuad,
		Steps:        dto.LSSStepMapping(steps),
	})
}
