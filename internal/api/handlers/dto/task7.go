package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type LSSRequest struct {
	X []float64 `json:"x"`
	Y []float64 `json:"y"`
}

type LSSStepDTO struct {
	Kind   string      `json:"kind"`
	Degree int         `json:"degree"`
	Matrix [][]float64 `json:"matrix,omitempty"`
	Vector []float64   `json:"vector,omitempty"`
	Pivot  int         `json:"pivot,omitempty"`
	Phase  string      `json:"phase,omitempty"`
	X      []float64   `json:"x_sol,omitempty"`
	Coeffs []float64   `json:"coeffs,omitempty"`
}

type LSSResponse struct {
	CoeffsLinear []float64    `json:"coeffs_linear"`
	CoeffsQuad   []float64    `json:"coeffs_quad"`
	CurveX       []float64    `json:"curve_x"`
	CurveYLinear []float64    `json:"curve_y_linear"`
	CurveYQuad   []float64    `json:"curve_y_quad"`
	Steps        []LSSStepDTO `json:"steps"`
}

func LSSStepMapping(steps []gomath.LSSStep) []LSSStepDTO {
	out := make([]LSSStepDTO, len(steps))
	for i, s := range steps {
		out[i] = LSSStepDTO{
			Kind:   s.Kind,
			Degree: s.Degree,
			Matrix: s.Matrix,
			Vector: s.Vector,
			Pivot:  s.Pivot,
			Phase:  s.Phase,
			X:      s.X,
			Coeffs: s.Coeffs,
		}
	}
	return out
}
