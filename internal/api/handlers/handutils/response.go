package handutils

import (
	"encoding/json"
	"net/http"

	errs "github.com/GeorgeTyupin/numerical_methods/internal/errors"
)

// RespondWithError отправляет HTTP-ответ с ошибкой в формате JSON
func RespondWithError(w http.ResponseWriter, code int, message string) {
	RespondWithJSON(w, code, errs.HTTPError{Error: message})
}

// RespondWithJSON отправляет HTTP-ответ с данными в формате JSON
func RespondWithJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(payload)
}
