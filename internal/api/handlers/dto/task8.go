package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type DiffRequest struct {
	X []float64 `json:"x"`
	Y []float64 `json:"y"`
}

type DiffStepDTO struct {
	I       int     `json:"i"`
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
	DY1     float64 `json:"dy1"`
	DY2     float64 `json:"dy2"`
	Formula string  `json:"formula"`
}

type DiffResponse struct {
	Steps []DiffStepDTO `json:"steps"`
}

func DiffStepMapping(steps []gomath.DiffStep) []DiffStepDTO {
	out := make([]DiffStepDTO, len(steps))
	for i, s := range steps {
		out[i] = DiffStepDTO{
			I: s.I, X: s.X, Y: s.Y,
			DY1: s.DY1, DY2: s.DY2, Formula: s.Formula,
		}
	}
	return out
}
