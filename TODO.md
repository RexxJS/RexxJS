# To do

Known bugs, with what reproduces them. Fix one with its jest spec in
`core/tests/` (the spec failing first), and take its entry out here.

## Recursion through CALL never stops

Found 2026-10-14, while making `IF()` lazy for sae's spreadsheet (a
function that calls itself). A routine called by CALL works, and so does
one called once from another; one that CALLs itself does not, for two
reasons, each its own bug.

```rexx
CALL DOWN 3
SAY "done"
EXIT
DOWN: PROCEDURE
  ARG n
  SAY n
  IF n > 0 THEN CALL DOWN n - 1
  RETURN 0
```

1. **An expression as CALL's argument is not worked out.** `CALL DOWN n - 1`
   passes 3 every time: the script says `3` until the heap runs out (Node
   aborts, "JavaScript heap out of memory"), where Rexx says 3, 2, 1, 0 and
   `done`. The usual factorial (`CALL FACT n - 1` ... `RETURN n * RESULT`)
   fails the same way.

2. **A variable holding 0, passed to CALL, arrives as its name.** With the
   argument worked out first,

   ```rexx
     LET m = n - 1
     IF n > 0 THEN CALL DOWN m
   ```

   the script says `3`, `2`, `1`, then `m`, and stops with "Non-numeric
   value in arithmetic: 'm' is not a valid number". At n = 1, m is 0, and
   the callee's `ARG n` gets the text `m`: as if a lookup takes 0 (falsy)
   for "no such variable" and falls back to the name.

Seen in `core/src` at `d27c738`.

## numpy-inspired functions called with no arguments give a value

Found 2026-10-14, when `extras/functions/numpy-inspired/__tests__/
parameter-requirement.spec.js` first loaded (its paths had been one level
short). Registered as built-in functions and called with no arguments,
they return something instead of NumPy's error for a missing argument:

```rexx
SAY ZEROS()     /* 0, where NumPy raises: missing 'shape' */
SAY ONES()      /* 1 */
SAY ARANGE()    /* 0,1,...,9: as if called with 10 */
SAY SUM()       /* nothing */
```

`zeros()` itself, given `undefined`, returns `[]`, so something in calling
a built-in with no parameters supplies an argument (`callConvertParamsToArgs`
is the place to look). `MATMUL()` fails, but on reading an undefined's
`length`. `ARRAY()` now throws "array() needs an object to make an array
of", as NumPy's does; the spec's other eleven are skipped until each
function checks its required argument.
