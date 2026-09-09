# Namespace Policy: fl::gfx and fl::math

## Policy

All source files under `src/fl/gfx/` and `src/fl/math/` MUST place their declarations in the corresponding sub-namespace:

| Directory | Namespace |
|-----------|-----------|
| `src/fl/gfx/**` | `namespace fl { namespace gfx { ... } }` |
| `src/fl/math/**` | `namespace fl { namespace math { ... } }` |

Sub-namespaces nest naturally:
- `src/fl/gfx/` → `fl::gfx` (same as parent)
- `src/fl/math/simd/` → `fl::math::simd`
- `src/fl/math/filter/` → `fl::math::detail` (internal)
- `src/fl/math/fixed_point/` → `fl::math`

## File Pattern

### Header files (.h)

```cpp
#pragma once
#include "..." // includes

namespace fl {
namespace gfx {  // or math

// ... declarations ...

} // namespace gfx
} // namespace fl
```

### Implementation files (.cpp.hpp)

```cpp
#pragma once
#include "..." // includes

namespace fl {
namespace gfx {  // or math

// ... definitions ...

} // namespace gfx
} // namespace fl
```

### _build.cpp.hpp files

No namespace declarations — these just `#include` other `.cpp.hpp` files.

## Forward Declarations

Forward declarations MUST be in the correct namespace:

```cpp
// CORRECT:
namespace fl { namespace math { class XYMap; } }
namespace fl { namespace gfx { struct CRGB; } }

// WRONG:
namespace fl { class XYMap; }  // XYMap is in fl::math
namespace fl { struct CRGB; }  // CRGB is in fl::gfx
```

## Cross-Namespace References

Code in `fl::gfx` that uses types from `fl::math` (or vice versa) should:
1. Include the relevant header, OR
2. Forward-declare in the correct namespace

Inside `fl::gfx`, use `math::XYMap` (not `fl::XYMap`) to reference math types.
Inside `fl::math`, use `gfx::CRGB` (not `fl::CRGB`) to reference gfx types.

## Template Specializations

Template specializations MUST be in the same namespace as the primary template:

```cpp
// Primary template in fl::
namespace fl { template<typename T> struct is_fixed_point : false_type {}; }

// Specialization MUST also be in fl::, not fl::math::
namespace fl {
template<int I, int F, math::Sign S>
struct is_fixed_point<math::fixed_point<I,F,S>> : true_type {};
}
```

## What NOT to Use

- **`using namespace gfx;`** / **`using namespace math;`** — Causes ambiguity with `detail` sub-namespaces and other name collisions
- Forward declarations in the wrong namespace — Creates conflicting type declarations
