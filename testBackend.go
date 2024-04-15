package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

func main() {
	// List all directories containing Go code
	modules, testFiles, err := findModulesAndTests()
	if err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	}

	if len(modules) == 0 {
		fmt.Println("No Go modules found.")
		os.Exit(0)
	}

	var totalCoverage float64
	var count int

	// Run tests with coverage for each module
	for i, module := range modules {
		testFile := testFiles[i]
		fmt.Println("\nRunning tests for module:", module)
		fmt.Println("Test file:", testFile) // Print the test file name
		cmd := exec.Command("go", "test", "-v", "-cover", "./...")
		cmd.Dir = module
		out, err := cmd.CombinedOutput()
		output := string(out)
		if err != nil {
			fmt.Printf("Error running tests for module %s: %v\n", module, err)
			printFailedTests(output) // Function to print failed test names
		}
		// Extract coverage percentage from output
		coverage := extractCoverage(output)
		fmt.Println("percent code covered by test:", coverage)

		// Convert coverage string to float
		covFloat, err := strconv.ParseFloat(strings.TrimSuffix(coverage, "%"), 64)
		if err == nil {
			totalCoverage += covFloat
			count++
		}
	}

	if count > 0 {
		overallCoverage := totalCoverage / float64(count)
		fmt.Printf("\nOverall code coverage: %.2f%%\n", overallCoverage)
	} else {
		fmt.Println("\nNo valid coverage data to calculate overall percentage.")
	}
}

func findModulesAndTests() ([]string, []string, error) {
	var modules []string
	var testFiles []string
	err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		// Check if it's a directory that contains test files
		if info.IsDir() {
			testFile, found := findTestFile(path)
			if found {
				modules = append(modules, path)
				testFiles = append(testFiles, testFile) // Save the test file name
			}
		}
		return nil
	})
	return modules, testFiles, err
}

func findTestFile(dir string) (string, bool) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", false
	}
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), "_test.go") {
			return entry.Name(), true
		}
	}
	return "", false
}

func extractCoverage(output string) string {
	lines := strings.Split(output, "\n")
	final := "0%"
	for _, line := range lines {
		if strings.Contains(line, "coverage:") && strings.Contains(line, "%") {
			fields := strings.Fields(line)
			for _, field := range fields {
				if strings.Contains(field, "%") {
					final = field
					break
				}
			}
		}
	}
	return final
}

func printFailedTests(output string) {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "--- FAIL:") {
			fmt.Println(line)
		}
	}
}
