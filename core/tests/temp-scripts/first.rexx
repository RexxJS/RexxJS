
      PARSE ARG value
      LET intermediate = value * 2
      LET final_result = CALL "./tests/temp-scripts/second.rexx" intermediate
      RETURN final_result
