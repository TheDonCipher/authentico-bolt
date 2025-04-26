@echo off
echo Running Cypress tests with improved error handling...

echo.
echo Step 1: Running basic tests first...
npx cypress run --spec "cypress/integration/basic/**/*.spec.{js,jsx,ts,tsx}"

echo.
echo Step 2: Running auth tests...
npx cypress run --spec "cypress/integration/auth/**/*.spec.{js,jsx,ts,tsx}"

echo.
echo Step 3: Running document tests...
npx cypress run --spec "cypress/integration/document/**/*.spec.{js,jsx,ts,tsx}"

echo.
echo Step 4: Running organization tests...
npx cypress run --spec "cypress/integration/organization/**/*.spec.{js,jsx,ts,tsx}"

echo.
echo Step 5: Running admin tests...
npx cypress run --spec "cypress/integration/admin/**/*.spec.{js,jsx,ts,tsx}"

echo.
echo Step 6: Running security tests...
npx cypress run --spec "cypress/integration/security/**/*.spec.{js,jsx,ts,tsx}"

echo.
echo All tests completed!
