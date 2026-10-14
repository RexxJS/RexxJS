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
