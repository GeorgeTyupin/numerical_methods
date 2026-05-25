package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type SimpsonRequest struct {
	Formula string  `json:"formula"`
	A       float64 `json:"a"`
	B       float64 `json:"b"`
	Epsilon float64 `json:"epsilon"`
}

type SimpsonStepDTO struct {
	K     int     `json:"k"`
	H     float64 `json:"h"`
	N     int     `json:"n"`
	S     float64 `json:"s"`
	SPrev float64 `json:"s_prev"`
	Diff  float64 `json:"diff"`
}

type SimpsonResponse struct {
	Integral float64          `json:"integral"`
	Steps    []SimpsonStepDTO `json:"steps"`
	CurveX   []float64        `json:"curve_x"`
	CurveY   []float64        `json:"curve_y"`
	SegX     []float64        `json:"seg_x"`
	SegY     []float64        `json:"seg_y"`
}

func SimpsonStepMapping(steps []gomath.SimpsonStep) []SimpsonStepDTO {
	out := make([]SimpsonStepDTO, len(steps))
	for i, s := range steps {
		out[i] = SimpsonStepDTO{K: s.K, H: s.H, N: s.N, S: s.S, SPrev: s.SPrev, Diff: s.Diff}
	}
	return out
}
