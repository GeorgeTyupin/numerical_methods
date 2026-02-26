package errs

import "errors"

// HTTPError - структура для возврата сообщений об ошибках в формате JSON
type HTTPError struct {
	Error string `json:"error"`
}

var (
	ErrInvalidJSON = errors.New("invalid JSON format")
)
