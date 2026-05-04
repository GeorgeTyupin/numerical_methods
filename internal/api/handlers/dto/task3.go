package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type JacobiRequest struct {
	Matrix  [][]float64 `json:"matrix"`
	Epsilon float64     `json:"epsilon"`
}

type JacobiStepDTO struct {
	Matrix [][]float64 `json:"matrix"`
	P      int         `json:"p"`
	Q      int         `json:"q"`
	Norm   float64     `json:"norm"`
	Phase  string      `json:"phase"`
}

type JacobiResponse struct {
	Eigenvalues  []float64       `json:"eigenvalues"`
	Eigenvectors [][]float64     `json:"eigenvectors"`
	Iterations   int             `json:"iterations"`
	Steps        []JacobiStepDTO `json:"steps"`
}

func JacobiStepMapping(steps []gomath.JacobiStep) []JacobiStepDTO {
	out := make([]JacobiStepDTO, len(steps))
	for i, s := range steps {
		out[i] = JacobiStepDTO{Matrix: s.Matrix, P: s.P, Q: s.Q, Norm: s.Norm, Phase: s.Phase}
	}
	return out
}
