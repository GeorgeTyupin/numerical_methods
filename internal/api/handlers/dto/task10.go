package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type CauchyRequest struct {
	Formula string  `json:"formula"`
	X0      float64 `json:"x0"`
	Y0      float64 `json:"y0"`
	XEnd    float64 `json:"x_end"`
	H       float64 `json:"h"`
}

type CauchyStepDTO struct {
	K      int     `json:"k"`
	X      float64 `json:"x"`
	YRK4   float64 `json:"y_rk4"`
	K1     float64 `json:"k1"`
	K2     float64 `json:"k2"`
	K3     float64 `json:"k3"`
	K4     float64 `json:"k4"`
	Phase  string  `json:"phase"`
	YAdams float64 `json:"y_adams"`
	Diff   float64 `json:"diff"`
}

type CauchyResponse struct {
	Steps []CauchyStepDTO `json:"steps"`
}

func CauchyStepMapping(steps []gomath.CauchyStep) []CauchyStepDTO {
	out := make([]CauchyStepDTO, len(steps))
	for i, s := range steps {
		out[i] = CauchyStepDTO{
			K: s.K, X: s.X, YRK4: s.YRK4,
			K1: s.K1, K2: s.K2, K3: s.K3, K4: s.K4,
			Phase: s.Phase, YAdams: s.YAdams, Diff: s.Diff,
		}
	}
	return out
}
