#!/bin/bash

# Authentico Backend Test Runner
# This script runs all backend tests in a logical order and provides clear output

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}======================================================${NC}"
  echo -e "${BLUE}= ${YELLOW}$1${NC}"
  echo -e "${BLUE}======================================================${NC}\n"
}

# Function to run tests and check result
run_test() {
  local test_name=$1
  local test_command=$2

  echo -e "${CYAN}Running $test_name...${NC}"

  # Run the test command
  npm run $test_command

  # Check if the test passed
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $test_name passed${NC}\n"
    return 0
  else
    echo -e "${RED}✗ $test_name failed${NC}\n"
    return 1
  fi
}

# Start the test run
clear
echo -e "${PURPLE}===============================================${NC}"
echo -e "${PURPLE}=      AUTHENTICO BACKEND TEST RUNNER        =${NC}"
echo -e "${PURPLE}===============================================${NC}"
echo -e "${YELLOW}Starting test run at $(date)${NC}\n"

# Track failures
failures=0

# Run simplified tests first (these are more reliable)
print_header "SIMPLIFIED TESTS"
run_test "Simplified Tests" "test:simplified"
if [ $? -ne 0 ]; then
  failures=$((failures + 1))
fi

# Run edge case tests
print_header "EDGE CASE TESTS"
run_test "Edge Case Tests" "test:edge"
if [ $? -ne 0 ]; then
  failures=$((failures + 1))
fi

# Run simplified tests
print_header "SIMPLIFIED TESTS"
echo -e "${CYAN}Running Simplified Tests...${NC}"
run_test "Simplified Tests" "test:simplified"
if [ $? -ne 0 ]; then
  failures=$((failures + 1))
fi

# Run edge case tests
print_header "EDGE CASE TESTS"
echo -e "${CYAN}Running Edge Case Tests...${NC}"
run_test "Edge Case Tests" "test:edge"
if [ $? -ne 0 ]; then
  failures=$((failures + 1))
fi

# Run unit tests (optional)
print_header "UNIT TESTS (OPTIONAL)"
echo -e "${CYAN}Running Unit Tests...${NC}"
run_test "Unit Tests" "test:unit" || true

# Run integration tests (optional)
print_header "INTEGRATION TESTS (OPTIONAL)"
echo -e "${CYAN}Running Integration Tests...${NC}"
run_test "Integration Tests" "test:integration" || true

# Run security tests if they exist (optional)
if [ -d "test/security" ]; then
  print_header "SECURITY TESTS (OPTIONAL)"
  run_test "Security Tests" "test:security" || true
fi

# Generate coverage report for core tests
print_header "CORE COVERAGE REPORT"
run_test "Core Coverage Report" "test:core:coverage"

# Print summary
print_header "TEST SUMMARY"
if [ $failures -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
else
  echo -e "${RED}$failures test suites failed.${NC}"
  echo -e "${YELLOW}Please check the output above for details.${NC}"
fi

echo -e "\n${YELLOW}Test run completed at $(date)${NC}"
echo -e "${PURPLE}===============================================${NC}"

# Exit with appropriate code
exit $failures
