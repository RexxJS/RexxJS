# Function Libraries and Argument Conventions

This document explains how RexxJS handles function calls (built‑ins and third‑party libraries), how arguments are passed (positional vs named), and how this interacts with external scripts and COPY()/pass‑by semantics.

## Overview

- Built‑in functions are implemented with positional parameters. For convenience, RexxJS can normalize named parameters to positional for known built‑ins.
- Third‑party libraries can integrate either as in‑process built‑ins or as ADDRESS targets. They do not need to depend on the interpreter’s internal argument normalizer.
- External `.rexx` scripts use REXX’s CALL semantics (space‑separated positional arguments only; commas are not supported).

## Argument Styles

- Positional (canonical REXX for function calls):
  - `JSON_STRINGIFY(obj, 2)`
- Named (interpreter convenience for built‑ins):
  - `JSON_STRINGIFY(object=obj, indent=2)`

Notes:
- For built‑ins, the interpreter maps recognized named fields to positional order before invocation.
- For unknown functions (e.g., third‑party), the interpreter does not attempt to guess names; see “Third‑Party Libraries” below.

## External Script Calls (CALL)

- Syntax: `CALL path/to/script.rexx arg1 arg2` (space‑separated only)
- No commas between arguments.
- Arguments are evaluated before the call. Strings are passed by value. Arrays/objects are passed by reference unless the caller uses `COPY(...)` to deep clone.
- In the callee, `PARSE ARG` binds the incoming positional arguments to variables:
  - `PARSE ARG a, b` (or `PARSE ARG a b`) assigns from `ARG.1`, `ARG.2`, etc., preserving object/array identity when applicable.

## COPY() and Pass‑By Semantics

- Strings (and other primitives) are naturally pass‑by‑value.
- Arrays/objects are pass‑by‑reference by default across CALL.
- `COPY(value)` produces a deep copy (where possible) so the callee cannot mutate the caller’s original data.
- Mutating helpers like `ARRAY_SET(array, key, value)` in the built‑ins operate in place on arrays/objects and return the same reference. This allows reference semantics to be observed by the caller when `COPY()` is not used.

## Built‑In Functions and Named Parameters

- Built‑ins have positional signatures but may accept named parameters as a convenience:
  - Example: `JSON_STRINGIFY(object=..., indent=...)` → mapped to `(object, indent)`.
- The interpreter’s internal normalizer converts recognized named fields to the positional order expected by the built‑in implementation.
- This mapping is limited to known built‑ins; it does not change function behavior.

## Third‑Party Libraries

Third‑party functionality can be provided in two ways:

- In‑process built‑ins (registered functions):
  - Prefer positional signatures in your implementation.
  - If you want to advertise named parameters, add a thin wrapper in your library that maps `{ name: value }` to positional arguments and calls your core function.

- ADDRESS targets (RPC‑style):
  - Receive a params object with named fields intact (the interpreter does not reorder/normalize unknown methods for you).
  - Parse and validate named parameters according to your API. You fully control argument semantics.

## Best Practices

- For users:
  - Use space‑separated arguments with CALL to external scripts.
  - Use `COPY(...)` when passing arrays/objects you want to protect from callee mutation.
  - Prefer positional arguments for functions; named parameters are supported for many built‑ins as a convenience.

- For library authors:
  - Keep a single source of truth for function behavior in your library module.
  - If exposing in‑process functions, accept positional args or provide your own small name→position adapter.
  - If exposing an ADDRESS target, expect named params and map them as you prefer.

