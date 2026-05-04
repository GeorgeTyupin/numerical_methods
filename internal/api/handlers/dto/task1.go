package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type GaussRequest struct {
	Matrix [][]float64 `json:"matrix"`
	Vector []float64   `json:"vector"`
}

type GaussStepDTO struct {
	Matrix [][]float64 `json:"matrix"`
	Vector []float64   `json:"vector"`
	Pivot  int         `json:"pivot"`
	Phase  string      `json:"phase"`
	X      []float64   `json:"x,omitempty"`
}

type GaussResponse struct {
	Solution []float64      `json:"solution"`
	Steps    []GaussStepDTO `json:"steps"`
}

func GaussStepMapping(steps []gomath.GaussStep) []GaussStepDTO {
	out := make([]GaussStepDTO, len(steps))
	for i, s := range steps {
		out[i] = GaussStepDTO{Matrix: s.Matrix, Vector: s.Vector, Pivot: s.Pivot, Phase: s.Phase, X: s.X}
	}
	return out
}

type SimpleIterSLAURequest struct {
	Matrix  [][]float64 `json:"matrix"`
	Vector  []float64   `json:"vector"`
	Epsilon float64     `json:"epsilon"`
}

type SimpleIterSLAUStepDTO struct {
	X     []float64 `json:"x"`
	Norm  float64   `json:"norm"`
	Phase string    `json:"phase"`
}

type SimpleIterSLAUResponse struct {
	Solution   []float64               `json:"solution"`
	Iterations int                     `json:"iterations"`
	Steps      []SimpleIterSLAUStepDTO `json:"steps"`
}

func SimpleIterSLAUStepMapping(steps []gomath.SimpleIterSLAUStep) []SimpleIterSLAUStepDTO {
	out := make([]SimpleIterSLAUStepDTO, len(steps))
	for i, s := range steps {
		out[i] = SimpleIterSLAUStepDTO{X: s.X, Norm: s.Norm, Phase: s.Phase}
	}
	return out
}
