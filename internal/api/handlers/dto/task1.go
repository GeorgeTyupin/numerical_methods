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
}

type GaussResponse struct {
	Solution []float64      `json:"solution"`
	Steps    []GaussStepDTO `json:"steps"`
}

func GaussStepMapping(steps []gomath.GaussStep) []GaussStepDTO {
	out := make([]GaussStepDTO, len(steps))
	for i, s := range steps {
		out[i] = GaussStepDTO{Matrix: s.Matrix, Vector: s.Vector, Pivot: s.Pivot}
	}
	return out
}

type SimpleIterSLAURequest struct {
	Matrix  [][]float64 `json:"matrix"`
	Vector  []float64   `json:"vector"`
	Epsilon float64     `json:"epsilon"`
}

type SimpleIterSLAUStepDTO struct {
	X    []float64 `json:"x"`
	Norm float64   `json:"norm"`
}

type SimpleIterSLAUResponse struct {
	Solution   []float64               `json:"solution"`
	Iterations int                     `json:"iterations"`
	Steps      []SimpleIterSLAUStepDTO `json:"steps"`
}

func SimpleIterSLAUStepMapping(steps []gomath.SimpleIterSLAUStep) []SimpleIterSLAUStepDTO {
	out := make([]SimpleIterSLAUStepDTO, len(steps))
	for i, s := range steps {
		out[i] = SimpleIterSLAUStepDTO{X: s.X, Norm: s.Norm}
	}
	return out
}
