package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"

	"github.com/GeorgeTyupin/numerical_methods/internal/api"
	"github.com/GeorgeTyupin/numerical_methods/internal/config"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	cfg := config.MustLoad(logger)

	server := api.NewHttpServer(logger, cfg)

	signalCh := make(chan os.Signal, 1)
	errCh := make(chan error, 1)
	signal.Notify(signalCh, os.Interrupt)

	go func() {
		if err := server.Run(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	select {
	case <-signalCh:
		stopCtx, cancel := context.WithTimeout(context.Background(), cfg.Server.Timeouts.Shutdown)
		defer cancel()

		if err := server.Stop(stopCtx); err != nil {
			logger.Error("ошибка завершения сервера", "error", err)
			os.Exit(1)
		}
	case err := <-errCh:
		logger.Error("ошибка запуска сервера", "error", err)
		os.Exit(1)
	}
}
