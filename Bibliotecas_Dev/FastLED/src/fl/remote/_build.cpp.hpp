/// @file remote/_build.hpp
/// @brief Unity build header for fl/remote/ directory
/// Includes in dependency order: base types, transport, rpc subsystem, then remote

// begin current directory includes
#include "fl/remote/remote.cpp.hpp"
#include "fl/remote/types.cpp.hpp"

// begin sub directory includes
#include "fl/remote/rpc/_build.cpp.hpp"
#include "fl/remote/transport/_build.cpp.hpp"
