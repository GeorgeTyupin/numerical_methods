package errs

import "errors"

var (
	ErrInvalidFormula = errors.New("invalid formula")
	ErrInvalidEpsilon = errors.New("invalid epsilon")
	ErrInvalidX0      = errors.New("invalid x0")
	ErrInvalidA       = errors.New("invalid a")
	ErrInvalidB       = errors.New("invalid b")
)
