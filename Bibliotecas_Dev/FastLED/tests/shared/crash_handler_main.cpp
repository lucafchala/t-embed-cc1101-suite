// ok standalone
// Crash handler initialization for runner.exe
// This file is compiled into a static library and linked with runner.exe
// to provide crash handling before any test DLLs are loaded.

// Workaround for Clang 19 AVX-512 intrinsics bug on Windows
#ifdef _WIN32
#define __AVX512BITALG__
#define __AVX512VPOPCNTDQ__
#endif

// Suppress -Wpragma-pack warnings from Windows SDK headers
#include "fl/stl/compiler_control.h"
#ifdef _WIN32
FL_DISABLE_WARNING_PUSH
FL_DISABLE_WARNING(pragma-pack)
#endif

#include "tests/crash_handler.h"

#ifdef _WIN32
FL_DISABLE_WARNING_POP
#endif

// Setup crash handler - this is called from runner.exe main()
// before loading any test DLLs
extern "C" void runner_setup_crash_handler() {
    setup_crash_handler();
}

// Print stack trace - callable from runner.exe watchdog timer
extern "C" void runner_print_stacktrace() {
    print_stacktrace();
}

// Print stack trace of a specific suspended thread (Windows only).
// The thread_handle must be a valid HANDLE to a suspended thread.
#ifdef _WIN32
extern "C" void runner_print_stacktrace_for_thread(void* thread_handle) {
    print_stacktrace_for_thread(thread_handle);
}
#endif
