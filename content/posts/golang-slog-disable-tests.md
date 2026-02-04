---
title: Disable Slog Messages in Go Tests
date: 2024-12-08
---

As much as I like [ZeroLog](https://github.com/rs/zerolog) for Go logging Slog being added to the standard library fits in with my rule of avoiding 3rd party packages when they are not entirely required hence I have started moving anything I work on over to it.

One thing I find especially annoying however is log messages inside tests. As such here is a quick code snippet which turns off all slog outputs, but only for tests. Stick it into any `_test.go` file to disable logging outputs for that package.

{{<highlight go>}}
// A no-op handler that discards all log messages.
type noopHandler struct{}

func (h *noopHandler) Enabled(context.Context, slog.Level) bool  { return false }
func (h*noopHandler) Handle(context.Context, slog.Record) error { return nil }
func (h *noopHandler) WithAttrs([]slog.Attr) slog.Handler        { return h }
func (h*noopHandler) WithGroup(string) slog.Handler             { return h }

// TestMain runs before any tests and applies globally for all tests in the package.
func TestMain(m *testing.M) {
 slog.SetDefault(slog.New(&noopHandler{}))

 exitVal := m.Run()
 os.Exit(exitVal)
}
{{</highlight>}}

*EDIT* The nice thing about doing things in public is excellent people can show you better ways to achive things! Anton x'ed/tweeted responded with this <https://x.com/ohmypy/status/1866078171340185706> which allows you to condense the above into the below,

{{<highlight go>}}
// TestMain runs before any tests and applies globally for all tests in the package.
func TestMain(m *testing.M) {
 slog.SetDefault(slog.New(slog.NewTextHandler(io.Discard, nil)))

 exitVal := m.Run()
 os.Exit(exitVal)
}
{{</highlight>}}
