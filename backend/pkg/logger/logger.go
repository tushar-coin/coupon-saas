package logger

import (
	"log/slog"
	"os"
	"path/filepath"

	"gopkg.in/natefinch/lumberjack.v2"
)

func InitLogger() {
	// Ensure logs directory exists
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		panic("failed to create log directory: " + err.Error())
	}
	// println("DEBUG: Log dir created at: " + logDir)

	// Configure file rotation
	fileLogger := &lumberjack.Logger{
		Filename:   filepath.Join(logDir, "app.log"),
		MaxSize:    10,   // Megabytes
		MaxBackups: 3,    // Keep 3 old files
		MaxAge:     28,   // Days
		Compress:   true, // Compress old files
	}

	absPath, _ := filepath.Abs(logDir)
	slog.Info("DEBUG: Logger initialized", "log_dir_abs_path", absPath)

	// Create JSON Handler writing ONLY to the file
	handler := slog.NewJSONHandler(fileLogger, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})

	// Set as global default logger
	logger := slog.New(handler)
	slog.SetDefault(logger)
}
