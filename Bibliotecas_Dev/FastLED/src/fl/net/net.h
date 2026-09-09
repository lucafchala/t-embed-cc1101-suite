#pragma once

/// @file fl/net/net.h
/// @brief Umbrella header for fl::net — high-level networking facade
///
/// Includes all fl::net sub-namespace headers:
///   - fl::net::OTA     — Over-the-air firmware updates (primary class at fl::net)
///   - fl::net::rpc     — RPC transport aliases (Remote server: see fl/remote/remote.h)
///   - fl::net::http::* — HTTP client (fetch) and server (facade)
///   - fl::net::ble::*  — BLE GATT transport (collection)
///
/// Future sub-namespaces (not yet created):
///   - fl::net::mqtt  — MQTT pub/sub
///   - fl::net::lora  — LoRa radio transport

#include "fl/net/http.h"  // IWYU pragma: export
#include "fl/net/ota.h"   // IWYU pragma: export
#include "fl/net/rpc.h"   // IWYU pragma: export
#include "fl/net/ble.h"   // IWYU pragma: export
