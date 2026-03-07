# Этап сборки (Build stage)
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Установка зависимостей для сборки (если потребуются)
RUN apk add --no-cache gcc musl-dev

# Копируем файлы зависимостей
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main/main.go

# Этап запуска (Runner stage)
FROM alpine:latest

WORKDIR /app

# Копируем бинарный файл из этапа сборки
COPY --from=builder /app/main .

# Копируем конфигурации, статические файлы и шаблоны
# Примечание: В будущем можно использовать go:embed для упаковки их в бинарник
COPY --from=builder /app/configs ./configs
COPY --from=builder /app/static ./static
COPY --from=builder /app/templates ./templates

# Открываем порт
EXPOSE 8080

# Запуск приложения
CMD ["./main"]
