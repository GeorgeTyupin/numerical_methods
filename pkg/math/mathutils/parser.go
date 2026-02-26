package mathutils

import (
	"fmt"
	"math"
	"regexp"
	"strings"

	"github.com/Knetic/govaluate"
)

// ParseFormula обрабатывает строку с функцией:
// 1. Если есть знак "=", переносит правую часть влево: "left - (right)"
// 2. Добавляет поддержку математических функций (ln, log, sin и др.)
func ParseFormula(formula string) (*govaluate.EvaluableExpression, error) {
	// Подготавливаем строку: если уравнение имеет вид A = B, преобразуем в A - (B)
	parts := strings.Split(formula, "=")
	var exprStr string
	if len(parts) == 2 {
		left := strings.TrimSpace(parts[0])
		right := strings.TrimSpace(parts[1])
		if right == "0" {
			exprStr = left
		} else {
			exprStr = fmt.Sprintf("%s - (%s)", left, right)
		}
	} else if len(parts) == 1 {
		exprStr = strings.TrimSpace(parts[0])
	} else {
		return nil, fmt.Errorf("формула содержит больше одного знака '='")
	}

	// Заменяем знак степени '^' на понятный библиотеке `govaluate` знак '**'
	exprStr = strings.ReplaceAll(exprStr, "^", "**")

	// Оборачиваем аргументы функций без скобок в скобки: `ln x` -> `ln(x)`
	reFuncParens := regexp.MustCompile(`(ln|log|sin|cos|tan|sqrt|abs|exp)\s+([a-zA-Z0-9_\.]+)`)
	exprStr = reFuncParens.ReplaceAllString(exprStr, "$1($2)")

	// Окружение для добавления кастомных функций
	functions := map[string]govaluate.ExpressionFunction{
		"ln": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Log(x), nil
		},
		"log": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Log10(x), nil
		},
		"sin": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Sin(x), nil
		},
		"cos": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Cos(x), nil
		},
		"tan": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Tan(x), nil
		},
		"sqrt": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Sqrt(x), nil
		},
		"abs": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Abs(x), nil
		},
		"exp": func(args ...interface{}) (interface{}, error) {
			x := args[0].(float64)
			return math.Exp(x), nil
		},
	}

	fn, err := govaluate.NewEvaluableExpressionWithFunctions(exprStr, functions)
	if err != nil {
		return nil, fmt.Errorf("ошибка парсинга формулы '%s': %w", exprStr, err)
	}

	return fn, nil
}
