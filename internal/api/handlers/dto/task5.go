package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type InterpolationRequest struct {
	X  []float64 `json:"x"`
	Y  []float64 `json:"y"`
	XS float64   `json:"xs"`
}

type LagrangeStepDTO struct {
	I    int     `json:"i"`
	LiX  float64 `json:"li_x"`
	Yi   float64 `json:"yi"`
	Term float64 `json:"term"`
}

type LagrangeResponse struct {
	Value   float64           `json:"value"`
	CurveX  []float64         `json:"curve_x"`
	CurveY  []float64         `json:"curve_y"`
	Steps   []LagrangeStepDTO `json:"steps"`
}

func LagrangeStepMapping(steps []gomath.LagrangeStep) []LagrangeStepDTO {
	out := make([]LagrangeStepDTO, len(steps))
	for i, s := range steps {
		out[i] = LagrangeStepDTO{I: s.I, LiX: s.LiX, Yi: s.Yi, Term: s.Term}
	}
	return out
}

type NewtonInterpStepDTO struct {
	Order  int       `json:"order"`
	Values []float64 `json:"values"`
}

type NewtonInterpResponse struct {
	Value  float64               `json:"value"`
	CurveX []float64             `json:"curve_x"`
	CurveY []float64             `json:"curve_y"`
	Steps  []NewtonInterpStepDTO `json:"steps"`
}

func NewtonInterpStepMapping(steps []gomath.NewtonInterpStep) []NewtonInterpStepDTO {
	out := make([]NewtonInterpStepDTO, len(steps))
	for i, s := range steps {
		out[i] = NewtonInterpStepDTO{Order: s.Order, Values: s.Values}
	}
	return out
}
