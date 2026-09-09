/// @file eorder.h
/// Defines color channel ordering enumerations

#pragma once

#include "fl/gfx/eorder.h"

// AMNESTY: fl::EOrder and fl::EOrderW are allowed in global scope via 'using'.
// These enum class types need global visibility for backward compatibility.
// Do not replace with a separate global plain enum — that would require
// static_cast everywhere the two enum types interact.
using EOrder = fl::EOrder;   // ok using
using EOrderW = fl::EOrderW; // ok using

// Bring enum values into global scope as constexpr constants
// (enum class values can't be imported with 'using')
constexpr EOrder RGB = EOrder::RGB;
constexpr EOrder RBG = EOrder::RBG;
constexpr EOrder GRB = EOrder::GRB;
constexpr EOrder GBR = EOrder::GBR;
constexpr EOrder BRG = EOrder::BRG;
constexpr EOrder BGR = EOrder::BGR;

constexpr EOrderW W3 = EOrderW::W3;
constexpr EOrderW W2 = EOrderW::W2;
constexpr EOrderW W1 = EOrderW::W1;
constexpr EOrderW W0 = EOrderW::W0;
constexpr EOrderW WDefault = EOrderW::WDefault;
