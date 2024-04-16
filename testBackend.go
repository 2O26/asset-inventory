package main

import (
	"bufio"
	"fmt"
	"math"
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

	var totalCoveredLines float64
	var totalLines int

	// Run tests with coverage for each module
	for i, module := range modules {
		testFile := testFiles[i]
		sourceFile := findSourceFile(testFile)
		modulePath := filepath.Join(".", module) // Use relative path
		fmt.Println("\nRunning tests for module:", module)
		fmt.Println("Test file:", testFile)
		fmt.Println("Source file:", sourceFile)
		cmd := exec.Command("go", "test", "-v", "-cover", "./...")
		cmd.Dir = modulePath
		out, err := cmd.CombinedOutput()
		output := string(out)
		if err != nil {
			fmt.Printf("Error running tests for module %s: %v\n", module, err)
			printFailedTests(output)
		}

		// Extract coverage percentage from output
		coverage := extractCoverage(output)
		fmt.Println("Percent code covered by test:", coverage)

		// Convert coverage string to float
		covFloat, err := strconv.ParseFloat(strings.TrimSuffix(coverage, "%"), 64)
		if err == nil {
			// sourceFile := findSourceFile(testFile)
			filePath := filepath.Join(modulePath, sourceFile)
			loc, err := countLinesOfCode(filePath)
			if err != nil {
				fmt.Printf("Error counting LOC: %v\n", err)
				continue
			}
			coveredLines := math.Round((covFloat / 100.0) * float64(loc))
			totalCoveredLines += coveredLines
			totalLines += loc

			fmt.Printf("Total lines in file: %d, Covered lines: %.2f\n", loc, coveredLines)
		}
	}

	if totalLines > 0 {
		overallCoverage := (totalCoveredLines / float64(totalLines)) * 100
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
		if info.IsDir() {
			testFile, found := findTestFile(path)
			if found {
				modules = append(modules, path)
				testFiles = append(testFiles, testFile)
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

func findSourceFile(testFileName string) string {
	baseName := strings.TrimSuffix(testFileName, "_test.go")
	return baseName + ".go"
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

func countLinesOfCode(filePath string) (int, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	count := 0
	for scanner.Scan() {
		count++
	}
	return count, scanner.Err()
}

func printFailedTests(output string) {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "--- FAIL:") {
			fmt.Println(line)
		}
	}
}
