// IWYU pragma: private

/// @file _build.hpp
/// @brief Unity build header for platforms\arm\stm32/ directory
/// Includes all implementation files in alphabetical order
///
/// Includes SPI hardware drivers from drivers/ subdirectory

// begin current directory includes
#include "platforms/arm/stm32/init_channel_driver_stm32.cpp.hpp"
#include "platforms/arm/stm32/init_stm32.cpp.hpp"
#include "platforms/arm/stm32/io_stm32.cpp.hpp"
#include "platforms/arm/stm32/mutex_stm32.cpp.hpp"
#include "platforms/arm/stm32/semaphore_stm32.cpp.hpp"
#include "platforms/arm/stm32/stm32_gpio_timer_helpers.cpp.hpp"

// begin sub directory includes
#include "platforms/arm/stm32/drivers/_build.cpp.hpp"
