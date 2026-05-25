package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

// BVPRequest описывает запрос для краевой задачи ОДУ:
//
//	y'' + p(x)·y' + q(x)·y = f(x)
//
// с граничными условиями общего вида (Дирихле / Неймана / Робена):
//
//	αA·y(a) + βA·y'(a) = γA   (левое ГУ)
//	αB·y(b) + βB·y'(b) = γB   (правое ГУ)
type BVPRequest struct {
	P string `json:"p"` // формула p(x)
	Q string `json:"q"` // формула q(x)
	F string `json:"f"` // формула f(x)
	A float64 `json:"a"`
	B float64 `json:"b"`
	// Левое ГУ
	AlphaA float64 `json:"alpha_a"`
	BetaA  float64 `json:"beta_a"`
	GammaA float64 `json:"gamma_a"`
	// Правое ГУ
	AlphaB float64 `json:"alpha_b"`
	BetaB  float64 `json:"beta_b"`
	GammaB float64 `json:"gamma_b"`
	H      float64 `json:"h"`
}

type BVPStepDTO struct {
	Phase  string      `json:"phase"`
	RowIdx int         `json:"row_idx,omitempty"`
	X      float64     `json:"x,omitempty"`
	MatRow []float64   `json:"mat_row,omitempty"`
	RHS    float64     `json:"rhs,omitempty"`
	Matrix [][]float64 `json:"matrix,omitempty"`
	Vector []float64   `json:"vector,omitempty"`
	Pivot  int         `json:"pivot,omitempty"`
	GaussX []float64   `json:"gauss_x,omitempty"`
}

type BVPResponse struct {
	Solution []float64    `json:"solution"`
	X        []float64    `json:"x"`
	Steps    []BVPStepDTO `json:"steps"`
}

func BVPStepMapping(steps []gomath.BVPStep) []BVPStepDTO {
	out := make([]BVPStepDTO, len(steps))
	for i, s := range steps {
		out[i] = BVPStepDTO{
			Phase:  s.Phase,
			RowIdx: s.RowIdx,
			X:      s.X,
			MatRow: s.MatRow,
			RHS:    s.RHS,
			Matrix: s.Matrix,
			Vector: s.Vector,
			Pivot:  s.Pivot,
			GaussX: s.GaussX,
		}
	}
	return out
}
