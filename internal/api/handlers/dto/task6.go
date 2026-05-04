package dto

import gomath "github.com/GeorgeTyupin/numerical_methods/pkg/math"

type SplineRequest struct {
	X []float64 `json:"x"`
	Y []float64 `json:"y"`
}

type SplineSegmentDTO struct {
	XLeft  float64 `json:"x_left"`
	XRight float64 `json:"x_right"`
	A      float64 `json:"a"`
	B      float64 `json:"b"`
	C      float64 `json:"c"`
	D      float64 `json:"d"`
}

type SplineResponse struct {
	Segments []SplineSegmentDTO `json:"segments"`
	CurveX   []float64          `json:"curve_x"`
	CurveY   []float64          `json:"curve_y"`
}

func SplineSegmentMapping(segments []gomath.SplineSegment) []SplineSegmentDTO {
	out := make([]SplineSegmentDTO, len(segments))
	for i, s := range segments {
		out[i] = SplineSegmentDTO{XLeft: s.XLeft, XRight: s.XRight, A: s.A, B: s.B, C: s.C, D: s.D}
	}
	return out
}
