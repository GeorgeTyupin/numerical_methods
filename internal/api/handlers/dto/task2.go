package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type TridiagonalRequest struct {
	A []float64 `json:"a"` // нижняя диагональ
	B []float64 `json:"b"` // главная диагональ
	C []float64 `json:"c"` // верхняя диагональ
	D []float64 `json:"d"` // правая часть
}

type TridiagonalStepDTO struct {
	Alpha []float64 `json:"alpha"`
	Beta  []float64 `json:"beta"`
	Index int       `json:"index"`
	Phase string    `json:"phase"`
	X     []float64 `json:"x,omitempty"`
}

type TridiagonalResponse struct {
	Solution []float64            `json:"solution"`
	Steps    []TridiagonalStepDTO `json:"steps"`
}

func TridiagonalStepMapping(steps []gomath.TridiagonalStep) []TridiagonalStepDTO {
	out := make([]TridiagonalStepDTO, len(steps))
	for i, s := range steps {
		out[i] = TridiagonalStepDTO{Alpha: s.Alpha, Beta: s.Beta, Index: s.Index, Phase: s.Phase, X: s.X}
	}
	return out
}

type SeidelRequest struct {
	Matrix  [][]float64 `json:"matrix"`
	Vector  []float64   `json:"vector"`
	Epsilon float64     `json:"epsilon"`
}

type SeidelStepDTO struct {
	X     []float64 `json:"x"`
	Norm  float64   `json:"norm"`
	Phase string    `json:"phase"`
}

type SeidelResponse struct {
	Solution   []float64       `json:"solution"`
	Iterations int             `json:"iterations"`
	Steps      []SeidelStepDTO `json:"steps"`
}

func SeidelStepMapping(steps []gomath.SeidelStep) []SeidelStepDTO {
	out := make([]SeidelStepDTO, len(steps))
	for i, s := range steps {
		out[i] = SeidelStepDTO{X: s.X, Norm: s.Norm, Phase: s.Phase}
	}
	return out
}
