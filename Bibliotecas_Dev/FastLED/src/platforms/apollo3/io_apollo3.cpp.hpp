#pragma once

// IWYU pragma: private
// ok no namespace fl

#include "platforms/apollo3/is_apollo3.h"

#if defined(FL_IS_APOLLO3)
#include "platforms/arduino/io_arduino.hpp"
#endif
