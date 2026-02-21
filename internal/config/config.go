package config

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/ilyakaznacheev/cleanenv"
)

const (
	component  = "config"
	configPath = "configs/server.yaml"
)

type Config struct {
	Server ServerConfig `yaml:"http_server"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
}

func MustLoad(logger *slog.Logger) *Config {
	const op = "MustLoad"
	logger = logger.With(slog.String("component", component), slog.String("op", op))

	config, err := LoadConfig()
	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	return config
}

func LoadConfig() (*Config, error) {
	var config *Config

	if err := cleanenv.ReadConfig(configPath, config); err != nil {
		return nil, fmt.Errorf("не получилось загрузить конфигурацию. Возникла ошибка: %w", err)
	}

	return config, nil
}
