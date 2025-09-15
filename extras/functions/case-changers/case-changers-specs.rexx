#!/usr/bin/env ../../../rexxt

/* @test-tags case-changers, string, functions */
/* @description Tests for case conversion functions */

/* Bring in the test framework */
REQUIRE "../../../core/src/expectations-address.js"

SAY "🎬 Starting Case Conversion Test Suite..."

/* Test Data */
pascal_case = "PascalCaseString"
snake_case = "snake_case_string"
kebab_case = "kebab-case-string"
title_case = "Title Case String"
camel_case = "camelCaseString"

/* ============================================================================= */
/* Test Plan:                                                                    */
/* 1. Convert from PascalCase to all other cases.                                */
/* 2. Convert from snake_case to all other cases.                                */
/* 3. Convert from kebab-case to all other cases.                                */
/* 4. Convert from Title Case to all other cases.                                */
/* 5. Convert from camelCase to all other cases.                                 */
/* ============================================================================= */

CALL FromPascalCaseTest
CALL FromSnakeCaseTest
CALL FromKebabCaseTest
CALL FromTitleCaseTest
CALL FromCamelCaseTest

SAY "✅ Case Conversion Test Suite Finished!"
EXIT 0

/* ============================================================================= */
/*                             Case Conversion Functions                         */
/* ============================================================================= */

wordify:
  PARSE ARG input_string

  input_string = TRANSLATE(input_string, ' ', '_-')

  new_string = ''
  DO i = 1 TO LENGTH(input_string)
    char = SUBSTR(input_string, i, 1)
    IF VERIFY(char, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') = 0 THEN
      new_string = new_string || ' ' || char
    ELSE
      new_string = new_string || char
  END
  input_string = new_string

  words = ''
  DO word_val OVER input_string.words()
    words = words || ' ' || LOWER(word_val)
  END

  RETURN words.strip()

to_pascal_case:
  PARSE ARG input_string
  CALL wordify input_string
  words = RESULT
  pascal_string = ''
  DO word_val OVER words.words()
    pascal_string = pascal_string || UPPER(SUBSTR(word_val, 1, 1)) || SUBSTR(word_val, 2)
  END
  RETURN pascal_string

to_snake_case:
  PARSE ARG input_string
  CALL wordify input_string
  words = RESULT
  snake_string = ''
  DO word_val OVER words.words()
    snake_string = snake_string || '_' || word_val
  END
  RETURN SUBSTR(snake_string, 2)

to_kebab_case:
  PARSE ARG input_string
  CALL wordify input_string
  words = RESULT
  kebab_string = ''
  DO word_val OVER words.words()
    kebab_string = kebab_string || '-' || word_val
  END
  RETURN SUBSTR(kebab_string, 2)

to_title_case:
  PARSE ARG input_string
  CALL wordify input_string
  words = RESULT
  title_string = ''
  DO word_val OVER words.words()
    title_string = title_string || ' ' || UPPER(SUBSTR(word_val, 1, 1)) || SUBSTR(word_val, 2)
  END
  RETURN SUBSTR(title_string, 2)

/* Test Subroutines */

FromPascalCaseTest:
  CALL to_pascal_case pascal_case
  ADDRESS EXPECTATIONS "{RESULT} should be PascalCaseString"
  CALL to_snake_case pascal_case
  ADDRESS EXPECTATIONS "{RESULT} should be pascal_case_string"
  CALL to_kebab_case pascal_case
  ADDRESS EXPECTATIONS "{RESULT} should be pascal-case-string"
  CALL to_title_case pascal_case
  ADDRESS EXPECTATIONS "{RESULT} should be Pascal Case String"
RETURN

FromSnakeCaseTest:
  CALL to_pascal_case snake_case
  ADDRESS EXPECTATIONS "{RESULT} should be SnakeCaseString"
  CALL to_snake_case snake_case
  ADDRESS EXPECTATIONS "{RESULT} should be snake_case_string"
  CALL to_kebab_case snake_case
  ADDRESS EXPECTATIONS "{RESULT} should be snake-case-string"
  CALL to_title_case snake_case
  ADDRESS EXPECTATIONS "{RESULT} should be Snake Case String"
RETURN

FromKebabCaseTest:
  CALL to_pascal_case kebab_case
  ADDRESS EXPECTATIONS "{RESULT} should be KebabCaseString"
  CALL to_snake_case kebab_case
  ADDRESS EXPECTATIONS "{RESULT} should be kebab_case_string"
  CALL to_kebab_case kebab_case
  ADDRESS EXPECTATIONS "{RESULT} should be kebab-case-string"
  CALL to_title_case kebab_case
  ADDRESS EXPECTATIONS "{RESULT} should be Kebab Case String"
RETURN

FromTitleCaseTest:
  CALL to_pascal_case title_case
  ADDRESS EXPECTATIONS "{RESULT} should be TitleCaseString"
  CALL to_snake_case title_case
  ADDRESS EXPECTATIONS "{RESULT} should be title_case_string"
  CALL to_kebab_case title_case
  ADDRESS EXPECTATIONS "{RESULT} should be title-case-string"
  CALL to_title_case title_case
  ADDRESS EXPECTATIONS "{RESULT} should be Title Case String"
RETURN

FromCamelCaseTest:
  CALL to_pascal_case camel_case
  ADDRESS EXPECTATIONS "{RESULT} should be CamelCaseString"
  CALL to_snake_case camel_case
  ADDRESS EXPECTATIONS "{RESULT} should be camel_case_string"
  CALL to_kebab_case camel_case
  ADDRESS EXPECTATIONS "{RESULT} should be camel-case-string"
  CALL to_title_case camel_case
  ADDRESS EXPECTATIONS "{RESULT} should be Camel Case String"
RETURN
