#ifndef CRASH_HANDLER_WIN_H
#define CRASH_HANDLER_WIN_H

#ifdef _WIN32

// Suppress -Wpragma-pack warnings from Windows SDK headers
// dbghelp.h includes _dbg_common.h which uses #pragma pack(push/pop)
#include "fl/stl/compiler_control.h"
FL_DISABLE_WARNING_PUSH
FL_DISABLE_WARNING(pragma-pack)

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <dbghelp.h>
#include <psapi.h>

FL_DISABLE_WARNING_POP
#include <csignal>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <io.h>
#include <fcntl.h>
#include <vector>
#include <string>

#include "fl/stl/singleton.h"

#ifdef _MSC_VER
#pragma comment(lib, "dbghelp.lib")
#pragma comment(lib, "psapi.lib")
#endif

namespace crash_handler_win {

/// All crash-handler state and logic, managed as a process-wide singleton.
struct CrashHandlerState {
    // --- State ---
    bool symbols_initialized = false;
    char crash_dump_path[MAX_PATH] = {0};
    int saved_stdout_fd = -1;
    int crash_dump_fd = -1;
    int script_counter = 0;

    static constexpr const char* kCrashDumpDir = ".gdb_crash";

    static CrashHandlerState& instance() {
        return fl::Singleton<CrashHandlerState>::instance();
    }

    // --- Crash dump file support ---

    bool begin_crash_dump() {
        CreateDirectoryA(kCrashDumpDir, NULL);
        // Extract executable basename
        char exePath[MAX_PATH] = {0};
        GetModuleFileNameA(NULL, exePath, MAX_PATH);
        const char* baseName = strrchr(exePath, '\\');
        if (!baseName) baseName = strrchr(exePath, '/');
        baseName = baseName ? baseName + 1 : exePath;
        // Strip .exe / .dll extension
        char cleanName[MAX_PATH];
        strncpy(cleanName, baseName, MAX_PATH - 1);
        cleanName[MAX_PATH - 1] = '\0';
        char* dot = strrchr(cleanName, '.');
        if (dot) *dot = '\0';
        // Use executable name + PID for uniqueness
        snprintf(crash_dump_path, sizeof(crash_dump_path),
                 "%s/crash_%s_%lu.txt", kCrashDumpDir, cleanName, GetCurrentProcessId());
        // Save original stdout fd
        saved_stdout_fd = _dup(_fileno(stdout));
        if (saved_stdout_fd < 0) return false;
        // Open dump file
        crash_dump_fd = _open(crash_dump_path,
                              _O_WRONLY | _O_CREAT | _O_TRUNC,
                              0666);
        if (crash_dump_fd < 0) {
            _close(saved_stdout_fd);
            saved_stdout_fd = -1;
            return false;
        }
        // Redirect stdout to crash dump file
        _dup2(crash_dump_fd, _fileno(stdout));
        return true;
    }

    void end_crash_dump() {
        fflush(stdout);
        if (saved_stdout_fd >= 0) {
            _dup2(saved_stdout_fd, _fileno(stdout));
            _close(saved_stdout_fd);
            saved_stdout_fd = -1;
        }
        if (crash_dump_fd >= 0) {
            _close(crash_dump_fd);
            crash_dump_fd = -1;
        }
        // Now stdout is back to console - print the dump to console too
        FILE* dump = fopen(crash_dump_path, "r");
        if (dump) {
            char buf[512];
            while (fgets(buf, sizeof(buf), dump)) {
                fputs(buf, stdout);
            }
            fclose(dump);
        }
        // Print marker so AI agents / test harness can find the dump
        printf("\n[CRASH_DUMP_FILE: %s]\n", crash_dump_path);
        fflush(stdout);
    }

    // --- Symbol helpers ---

    std::string get_module_name(DWORD64 address) {
        HMODULE hModule;
        if (GetModuleHandleEx(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                             GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
                             (LPCTSTR)address, &hModule)) {
            char moduleName[MAX_PATH];
            if (GetModuleFileNameA(hModule, moduleName, MAX_PATH)) {
                char* fileName = strrchr(moduleName, '\\');
                if (fileName) fileName++;
                else fileName = moduleName;
                return std::string(fileName);
            }
        }
        return "unknown";
    }

    std::string demangle_symbol(const char* symbol_name) {
        if (!symbol_name) return "unknown";
        return std::string(symbol_name);
    }

    std::string get_symbol_with_gdb(DWORD64 address) {
        HMODULE hModule = nullptr;
        if (!GetModuleHandleExA(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS,
                               (LPCSTR)address, &hModule)) {
            return "-- module not found";
        }

        DWORD64 fileOffset = address - (DWORD64)hModule;

        char modulePath[MAX_PATH];
        if (!GetModuleFileNameA(hModule, modulePath, MAX_PATH)) {
            return "-- module path not found";
        }

        // Get PE ImageBase from the executable headers
        IMAGE_DOS_HEADER dosHeader;
        IMAGE_NT_HEADERS64 ntHeaders;
        DWORD64 peImageBase = 0x140000000;  // Default for 64-bit PE

        FILE* exeFile = fopen(modulePath, "rb");
        if (exeFile) {
            if (fread(&dosHeader, sizeof(IMAGE_DOS_HEADER), 1, exeFile) == 1) {
                if (fseek(exeFile, dosHeader.e_lfanew, SEEK_SET) == 0) {
                    if (fread(&ntHeaders, sizeof(IMAGE_NT_HEADERS64), 1, exeFile) == 1) {
                        if (ntHeaders.Signature == IMAGE_NT_SIGNATURE) {
                            peImageBase = ntHeaders.OptionalHeader.ImageBase;
                        }
                    }
                }
            }
            fclose(exeFile);
        }

        DWORD64 peAddress = peImageBase + fileOffset;

        CreateDirectoryA(kCrashDumpDir, NULL);
        char script_name[256];
        snprintf(script_name, sizeof(script_name), "%s/gdb_temp_%d.gdb",
                 kCrashDumpDir, ++script_counter);

        FILE* script = fopen(script_name, "w");
        if (!script) {
            return "-- gdb script creation failed";
        }

        char gdbPath[MAX_PATH];
        strncpy(gdbPath, modulePath, MAX_PATH);
        for (char* p = gdbPath; *p; p++) {
            if (*p == '\\') *p = '/';
        }

        fprintf(script, "file %s\n", gdbPath);
        fprintf(script, "info symbol 0x%llx\n", peAddress);
        fprintf(script, "info line *0x%llx\n", peAddress);
        fprintf(script, "quit\n");
        fclose(script);

        char command[1024];
        snprintf(command, sizeof(command), "gdb -batch -x %s 2>&1", script_name);

        FILE* pipe = _popen(command, "r");
        if (!pipe) {
            return "-- gdb failed";
        }

        char output[512] = {0};
        std::string symbol_result;
        std::string line_result;

        while (fgets(output, sizeof(output), pipe)) {
            std::string line(output);

            if (!line.empty() && line.back() == '\n') {
                line.pop_back();
            }

            if (line.find("Copyright") != std::string::npos ||
                line.find("This GDB") != std::string::npos ||
                line.find("License") != std::string::npos ||
                line.empty()) {
                continue;
            }

            if (line.find(" in section ") != std::string::npos) {
                size_t in_pos = line.find(" in section ");
                if (in_pos != std::string::npos) {
                    symbol_result = line.substr(0, in_pos);
                }
            } else if (line.find("No symbol matches") != std::string::npos) {
                symbol_result = "-- symbol not found";
            } else if (line.find("Line ") != std::string::npos && line.find(" of ") != std::string::npos) {
                line_result = line;
            } else if (line.find("No line number information") != std::string::npos) {
                line_result = "-- no line info";
            }
        }

        _pclose(pipe);
        remove(script_name);

        std::string result;
        if (!symbol_result.empty() && symbol_result != "-- symbol not found") {
            result = symbol_result;
            if (!line_result.empty() && line_result != "-- no line info") {
                result += " (" + line_result + ")";
            }
        } else if (!line_result.empty() && line_result != "-- no line info") {
            result = line_result;
        } else {
            result = "-- no debug information available";
        }

        return result;
    }

    // --- Stack trace printers ---

    void init_symbols() {
        if (symbols_initialized) return;
        HANDLE process = GetCurrentProcess();
        SymSetOptions(SYMOPT_LOAD_LINES |
                     SYMOPT_DEFERRED_LOADS |
                     SYMOPT_UNDNAME |
                     SYMOPT_DEBUG |
                     SYMOPT_LOAD_ANYTHING |
                     SYMOPT_CASE_INSENSITIVE |
                     SYMOPT_FAVOR_COMPRESSED |
                     SYMOPT_INCLUDE_32BIT_MODULES |
                     SYMOPT_AUTO_PUBLICS);

        char currentPath[MAX_PATH];
        GetCurrentDirectoryA(MAX_PATH, currentPath);
        if (!SymInitialize(process, currentPath, TRUE)) {
            DWORD error = GetLastError();
            printf("SymInitialize failed with error %lu (0x%lx)\n", error, error);
            printf("This may be due to missing debug symbols or insufficient permissions.\n");
            printf("Try running as administrator or ensure debug symbols are available.\n\n");
        } else {
            symbols_initialized = true;
            printf("Symbol handler initialized successfully.\n");
        }
    }

    void print_symbol_for_address(DWORD64 address) {
        HANDLE process = GetCurrentProcess();
        std::string moduleName = get_module_name(address);
        printf(" [%s]", moduleName.c_str());

        std::string gdb_result = get_symbol_with_gdb(address);
        if (gdb_result.find("--") != 0) {
            printf(" %s", gdb_result.c_str());
        } else if (symbols_initialized) {
            char symbolBuffer[sizeof(SYMBOL_INFO) + MAX_SYM_NAME * sizeof(TCHAR)];
            PSYMBOL_INFO pSymbol = (PSYMBOL_INFO)symbolBuffer;
            pSymbol->SizeOfStruct = sizeof(SYMBOL_INFO);
            pSymbol->MaxNameLen = MAX_SYM_NAME;

            DWORD64 displacement = 0;
            if (SymFromAddr(process, address, &displacement, pSymbol)) {
                std::string demangled = demangle_symbol(pSymbol->Name);
                printf(" %s+0x%llx (via Windows API)", demangled.c_str(), displacement);

                IMAGEHLP_LINE64 line;
                line.SizeOfStruct = sizeof(IMAGEHLP_LINE64);
                DWORD lineDisplacement = 0;
                if (SymGetLineFromAddr64(process, address, &lineDisplacement, &line)) {
                    char* fileName = strrchr(line.FileName, '\\');
                    if (fileName) fileName++;
                    else fileName = line.FileName;
                    printf(" [%s:%lu]", fileName, line.LineNumber);
                }
            } else {
                DWORD error = GetLastError();
                if (error != ERROR_MOD_NOT_FOUND) {
                    printf(" -- symbol lookup failed (error %lu)", error);
                } else {
                    printf(" -- no debug symbols available");
                }
            }
        } else {
            printf(" -- no symbol resolution available");
        }
    }

    void print_loaded_modules() {
        HANDLE process = GetCurrentProcess();
        printf("\nLoaded modules:\n");
        HMODULE hModules[1024];
        DWORD cbNeeded;
        if (EnumProcessModules(process, hModules, sizeof(hModules), &cbNeeded)) {
            for (unsigned int i = 0; i < (cbNeeded / sizeof(HMODULE)); i++) {
                char moduleName[MAX_PATH];
                if (GetModuleFileNameA(hModules[i], moduleName, MAX_PATH)) {
                    char* fileName = strrchr(moduleName, '\\');
                    if (fileName) fileName++;
                    else fileName = moduleName;
                    printf("  %s\n", fileName);
                }
            }
        }
        printf("\n");
    }

    void print_stacktrace_windows() {
        init_symbols();

        void* stack[100];
        WORD numberOfFrames = CaptureStackBackTrace(0, 100, stack, nullptr);

        printf("Stack trace (Windows):\n");
        printf("Captured %d frames:\n\n", numberOfFrames);

        for (WORD i = 0; i < numberOfFrames; i++) {
            DWORD64 address = (DWORD64)(stack[i]);
            printf("#%-2d 0x%016llx", i, address);
            print_symbol_for_address(address);
            printf("\n");
        }

        printf("\nDebug Information:\n");
        printf("- Symbol handler initialized: %s\n", symbols_initialized ? "Yes" : "No");
        printf("- Process ID: %lu\n", GetCurrentProcessId());
        printf("- Thread ID: %lu\n", GetCurrentThreadId());

        print_loaded_modules();
    }

    void print_stacktrace_from_context(CONTEXT* ctx) {
        HANDLE process = GetCurrentProcess();
        HANDLE thread = GetCurrentThread();
        init_symbols();

        CONTEXT ctxCopy = *ctx;

        STACKFRAME64 frame;
        memset(&frame, 0, sizeof(frame));
#if defined(_M_X64) || defined(__x86_64__) || defined(__amd64__)
        DWORD machineType = IMAGE_FILE_MACHINE_AMD64;
        frame.AddrPC.Offset = ctxCopy.Rip;
        frame.AddrPC.Mode = AddrModeFlat;
        frame.AddrFrame.Offset = ctxCopy.Rbp;
        frame.AddrFrame.Mode = AddrModeFlat;
        frame.AddrStack.Offset = ctxCopy.Rsp;
        frame.AddrStack.Mode = AddrModeFlat;
#else
        DWORD machineType = IMAGE_FILE_MACHINE_I386;
        frame.AddrPC.Offset = ctxCopy.Eip;
        frame.AddrPC.Mode = AddrModeFlat;
        frame.AddrFrame.Offset = ctxCopy.Ebp;
        frame.AddrFrame.Mode = AddrModeFlat;
        frame.AddrStack.Offset = ctxCopy.Esp;
        frame.AddrStack.Mode = AddrModeFlat;
#endif

        printf("Stack trace (from exception context via StackWalk64):\n\n");

#if defined(_M_X64) || defined(__x86_64__) || defined(__amd64__)
        if (ctxCopy.Rip == 0 && ctxCopy.Rsp != 0) {
            printf("#0  0x0000000000000000 [<null>] -- null function pointer call\n");
            DWORD64 retAddr = 0;
            SIZE_T bytesRead = 0;
            if (ReadProcessMemory(process, (LPCVOID)ctxCopy.Rsp, &retAddr,
                                  sizeof(retAddr), &bytesRead) && bytesRead == sizeof(retAddr)) {
                ctxCopy.Rip = retAddr;
                ctxCopy.Rsp += sizeof(DWORD64);
                memset(&frame, 0, sizeof(frame));
                frame.AddrPC.Offset = ctxCopy.Rip;
                frame.AddrPC.Mode = AddrModeFlat;
                frame.AddrFrame.Offset = ctxCopy.Rbp;
                frame.AddrFrame.Mode = AddrModeFlat;
                frame.AddrStack.Offset = ctxCopy.Rsp;
                frame.AddrStack.Mode = AddrModeFlat;
            }
        }
#endif

        for (int i = 0; i < 100; i++) {
            if (!StackWalk64(machineType, process, thread, &frame, &ctxCopy,
                             nullptr, SymFunctionTableAccess64, SymGetModuleBase64, nullptr)) {
                break;
            }

            if (frame.AddrPC.Offset == 0) {
                break;
            }

            DWORD64 address = frame.AddrPC.Offset;
            printf("#%-2d 0x%016llx", i + 1, address);
            print_symbol_for_address(address);
            printf("\n");
        }

        print_loaded_modules();
    }

    void print_stacktrace_for_thread(HANDLE thread_handle) {
        HANDLE process = GetCurrentProcess();
        init_symbols();

        CONTEXT ctx;
        memset(&ctx, 0, sizeof(ctx));
        ctx.ContextFlags = CONTEXT_FULL;
        if (!GetThreadContext(thread_handle, &ctx)) {
            printf("GetThreadContext failed with error %lu\n", GetLastError());
            print_stacktrace_windows();
            return;
        }

        STACKFRAME64 frame;
        memset(&frame, 0, sizeof(frame));
#ifdef _M_X64
        DWORD machineType = IMAGE_FILE_MACHINE_AMD64;
        frame.AddrPC.Offset = ctx.Rip;
        frame.AddrPC.Mode = AddrModeFlat;
        frame.AddrFrame.Offset = ctx.Rbp;
        frame.AddrFrame.Mode = AddrModeFlat;
        frame.AddrStack.Offset = ctx.Rsp;
        frame.AddrStack.Mode = AddrModeFlat;
#elif defined(__x86_64__) || defined(__amd64__)
        DWORD machineType = IMAGE_FILE_MACHINE_AMD64;
        frame.AddrPC.Offset = ctx.Rip;
        frame.AddrPC.Mode = AddrModeFlat;
        frame.AddrFrame.Offset = ctx.Rbp;
        frame.AddrFrame.Mode = AddrModeFlat;
        frame.AddrStack.Offset = ctx.Rsp;
        frame.AddrStack.Mode = AddrModeFlat;
#else
        DWORD machineType = IMAGE_FILE_MACHINE_I386;
        frame.AddrPC.Offset = ctx.Eip;
        frame.AddrPC.Mode = AddrModeFlat;
        frame.AddrFrame.Offset = ctx.Ebp;
        frame.AddrFrame.Mode = AddrModeFlat;
        frame.AddrStack.Offset = ctx.Esp;
        frame.AddrStack.Mode = AddrModeFlat;
#endif

        printf("Stack trace (main thread, via StackWalk64):\n\n");

        for (int i = 0; i < 100; i++) {
            if (!StackWalk64(machineType, process, thread_handle, &frame, &ctx,
                             nullptr, SymFunctionTableAccess64, SymGetModuleBase64, nullptr)) {
                break;
            }

            if (frame.AddrPC.Offset == 0) {
                break;
            }

            DWORD64 address = frame.AddrPC.Offset;
            printf("#%-2d 0x%016llx", i, address);
            print_symbol_for_address(address);
            printf("\n");
        }
        printf("\n");
    }

    // --- Exception / signal handling ---

    static bool is_fatal_exception(DWORD code) {
        switch (code) {
            case EXCEPTION_ACCESS_VIOLATION:
            case EXCEPTION_STACK_OVERFLOW:
            case EXCEPTION_ILLEGAL_INSTRUCTION:
            case EXCEPTION_PRIV_INSTRUCTION:
            case EXCEPTION_NONCONTINUABLE_EXCEPTION:
            case EXCEPTION_ARRAY_BOUNDS_EXCEEDED:
            case EXCEPTION_FLT_DIVIDE_BY_ZERO:
            case EXCEPTION_FLT_INVALID_OPERATION:
            case EXCEPTION_FLT_OVERFLOW:
            case EXCEPTION_FLT_STACK_CHECK:
            case EXCEPTION_FLT_UNDERFLOW:
            case EXCEPTION_INT_DIVIDE_BY_ZERO:
            case EXCEPTION_INT_OVERFLOW:
            case 0xC0000374: // STATUS_HEAP_CORRUPTION
                return true;
            default:
                return false;
        }
    }

    static void print_exception_type(DWORD code, EXCEPTION_RECORD* record) {
        switch (code) {
            case EXCEPTION_ACCESS_VIOLATION:
                printf("Exception type: Access Violation\n");
                printf("Attempted to %s at address 0x%p\n",
                       record->ExceptionInformation[0] ? "write" : "read",
                       (void*)record->ExceptionInformation[1]);
                break;
            case EXCEPTION_STACK_OVERFLOW:
                printf("Exception type: Stack Overflow\n");
                break;
            case EXCEPTION_ILLEGAL_INSTRUCTION:
                printf("Exception type: Illegal Instruction\n");
                break;
            case EXCEPTION_PRIV_INSTRUCTION:
                printf("Exception type: Privileged Instruction\n");
                break;
            case EXCEPTION_NONCONTINUABLE_EXCEPTION:
                printf("Exception type: Non-continuable Exception\n");
                break;
            case EXCEPTION_ARRAY_BOUNDS_EXCEEDED:
                printf("Exception type: Array Bounds Exceeded\n");
                break;
            case EXCEPTION_FLT_DENORMAL_OPERAND:
                printf("Exception type: Floating Point Denormal Operand\n");
                break;
            case EXCEPTION_FLT_DIVIDE_BY_ZERO:
                printf("Exception type: Floating Point Divide by Zero\n");
                break;
            case EXCEPTION_FLT_INEXACT_RESULT:
                printf("Exception type: Floating Point Inexact Result\n");
                break;
            case EXCEPTION_FLT_INVALID_OPERATION:
                printf("Exception type: Floating Point Invalid Operation\n");
                break;
            case EXCEPTION_FLT_OVERFLOW:
                printf("Exception type: Floating Point Overflow\n");
                break;
            case EXCEPTION_FLT_STACK_CHECK:
                printf("Exception type: Floating Point Stack Check\n");
                break;
            case EXCEPTION_FLT_UNDERFLOW:
                printf("Exception type: Floating Point Underflow\n");
                break;
            case EXCEPTION_INT_DIVIDE_BY_ZERO:
                printf("Exception type: Integer Divide by Zero\n");
                break;
            case EXCEPTION_INT_OVERFLOW:
                printf("Exception type: Integer Overflow\n");
                break;
            case 0xC0000374: // STATUS_HEAP_CORRUPTION
                printf("Exception type: Heap Corruption\n");
                printf("This typically indicates a buffer overflow, use-after-free, or double-free.\n");
                printf("Run with --debug (ASAN) to get detailed allocation/deallocation traces.\n");
                break;
            default:
                printf("Exception type: Unknown (0x%08lx)\n", code);
                break;
        }
    }

    // --- Static callbacks (Windows API requires function pointers) ---

    static LONG WINAPI exception_handler_callback(EXCEPTION_POINTERS* ExceptionInfo) {
        DWORD code = ExceptionInfo->ExceptionRecord->ExceptionCode;

        if (!is_fatal_exception(code)) {
            return EXCEPTION_CONTINUE_SEARCH;
        }

        // Prevent recursion if handler crashes
        static volatile LONG already_dumping = 0;
        if (InterlockedExchange(&already_dumping, 1) != 0) {
            return EXCEPTION_CONTINUE_SEARCH;
        }

        auto& self = instance();
        self.begin_crash_dump();

        printf("\n=== INTERNAL EXCEPTION HANDLER (WINDOWS) ===\n");
        printf("Exception caught: 0x%08lx at address 0x%p\n",
               code, ExceptionInfo->ExceptionRecord->ExceptionAddress);

        print_exception_type(code, ExceptionInfo->ExceptionRecord);

        self.print_stacktrace_from_context(ExceptionInfo->ContextRecord);

        printf("=== END INTERNAL HANDLER ===\n\n");

        self.end_crash_dump();

        printf("Uninstalling exception handler, passing exception to external debugger...\n");
        fflush(stdout);

        SetUnhandledExceptionFilter(NULL);

        return EXCEPTION_CONTINUE_SEARCH;
    }

    static void signal_handler_callback(int sig) {
        // Prevent recursion if handler crashes
        static volatile sig_atomic_t already_dumping = 0;
        if (already_dumping) {
            signal(sig, SIG_DFL);
            raise(sig);
            return;
        }
        already_dumping = 1;

        auto& self = instance();
        self.begin_crash_dump();

        printf("\n=== INTERNAL CRASH HANDLER (SIGNAL) ===\n");
        fprintf(stderr, "Error: signal %d:\n", sig);

        switch (sig) {
            case SIGABRT: printf("Signal: SIGABRT (Abort)\n"); break;
            case SIGFPE:  printf("Signal: SIGFPE (Floating Point Exception)\n"); break;
            case SIGILL:  printf("Signal: SIGILL (Illegal Instruction)\n"); break;
            case SIGINT:  printf("Signal: SIGINT (Interrupt)\n"); break;
            case SIGSEGV: printf("Signal: SIGSEGV (Segmentation Fault)\n"); break;
            case SIGTERM: printf("Signal: SIGTERM (Termination)\n"); break;
            default:      printf("Signal: Unknown (%d)\n", sig); break;
        }

        self.print_stacktrace_windows();
        printf("=== END INTERNAL HANDLER ===\n\n");

        self.end_crash_dump();

        printf("Uninstalling crash handler and re-raising signal %d for external debugger...\n", sig);
        fflush(stdout);

        signal(sig, SIG_DFL);
        raise(sig);
        exit(1);
    }

    // --- Setup ---

    void setup() {
        const char* disable_handler = getenv("FASTLED_DISABLE_CRASH_HANDLER");
        if (disable_handler && (strcmp(disable_handler, "1") == 0 || strcmp(disable_handler, "true") == 0)) {
            printf("Crash handler disabled (FASTLED_DISABLE_CRASH_HANDLER set)\n");
            printf("This allows external debuggers to attach for deadlock detection.\n");
            return;
        }

        if (GetModuleHandleA("clang_rt.asan_dynamic-x86_64.dll") != NULL ||
            GetModuleHandleA("libclang_rt.asan_dynamic-x86_64.dll") != NULL) {
            printf("Crash handler disabled (AddressSanitizer detected)\n");
            return;
        }

        printf("Setting up Windows crash handler...\n");

        AddVectoredExceptionHandler(1, exception_handler_callback);
        SetUnhandledExceptionFilter(exception_handler_callback);

        signal(SIGABRT, signal_handler_callback);
        signal(SIGFPE, signal_handler_callback);
        signal(SIGILL, signal_handler_callback);
        signal(SIGINT, signal_handler_callback);
        signal(SIGSEGV, signal_handler_callback);
        signal(SIGTERM, signal_handler_callback);

        printf("Windows crash handler setup complete.\n");
    }
};

// --- Free-function API (delegates to singleton) ---

inline void crash_handler(int sig) {
    CrashHandlerState::signal_handler_callback(sig);
}

inline void print_stacktrace() {
    CrashHandlerState::instance().print_stacktrace_windows();
}

inline void setup_crash_handler() {
    CrashHandlerState::instance().setup();
}

inline void print_stacktrace_for_thread(HANDLE thread_handle) {
    CrashHandlerState::instance().print_stacktrace_for_thread(thread_handle);
}

} // namespace crash_handler_win

#endif // _WIN32

#endif // CRASH_HANDLER_WIN_H
