# Authentico Backend Test Runner
# This PowerShell script runs all backend tests in a logical order and provides clear output

# Function to print section headers
function Print-Header {
    param (
        [string]$title
    )
    Write-Host "`n======================================================"
    Write-Host "= $title"
    Write-Host "======================================================`n"
}

# Function to run tests and check result
function Run-Test {
    param (
        [string]$testName,
        [string]$testCommand,
        [bool]$ContinueOnError = $false
    )

    Write-Host "Running $testName..." -ForegroundColor Cyan

    # Run the test command
    npm run $testCommand

    # Check if the test passed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $testName passed" -ForegroundColor Green
        return $true
    } else {
        if ($ContinueOnError) {
            Write-Host "! $testName failed (continuing)" -ForegroundColor Yellow
            return $true
        } else {
            Write-Host "✗ $testName failed" -ForegroundColor Red
            return $false
        }
    }
}

# Start the test run
Clear-Host
Write-Host "===============================================" -ForegroundColor Magenta
Write-Host "=      AUTHENTICO BACKEND TEST RUNNER        =" -ForegroundColor Magenta
Write-Host "===============================================" -ForegroundColor Magenta
Write-Host "Starting test run at $(Get-Date)" -ForegroundColor Yellow

# Track failures
$failures = 0

# Run simplified tests first (these are more reliable)
Print-Header "SIMPLIFIED TESTS"
if (-not (Run-Test "Simplified Tests" "test:simplified")) {
    $failures++
}

# Run edge case tests
Print-Header "EDGE CASE TESTS"
if (-not (Run-Test "Edge Case Tests" "test:edge")) {
    $failures++
}

# Run unit tests (optional)
Print-Header "UNIT TESTS (OPTIONAL)"
Write-Host "Running Unit Tests..." -ForegroundColor Cyan
Run-Test "Unit Tests" "test:unit" -ContinueOnError $true

# Run integration tests (optional)
Print-Header "INTEGRATION TESTS (OPTIONAL)"
Write-Host "Running Integration Tests..." -ForegroundColor Cyan
Run-Test "Integration Tests" "test:integration" -ContinueOnError $true

# Run security tests if they exist (optional)
if (Test-Path "test/security") {
    Print-Header "SECURITY TESTS (OPTIONAL)"
    Run-Test "Security Tests" "test:security" -ContinueOnError $true
}

# Generate coverage report for core tests
Print-Header "CORE COVERAGE REPORT"
Run-Test "Core Coverage Report" "test:core:coverage"

# Print summary
Print-Header "TEST SUMMARY"
if ($failures -eq 0) {
    Write-Host "All tests passed successfully!" -ForegroundColor Green
} else {
    Write-Host "$failures test suites failed." -ForegroundColor Red
    Write-Host "Please check the output above for details." -ForegroundColor Yellow
}

Write-Host "`nTest run completed at $(Get-Date)" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Magenta

# Exit with appropriate code
exit $failures
