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

const (
	reset  = "\033[0m"
	red    = "\033[31m"
	green  = "\033[32m"
	yellow = "\033[33m"
	cyan   = "\033[36m"
	white  = "\033[37m"
	blue   = "\033[94m"
)

func main() {
	fmt.Println(cyan + "Starting Go code test coverage analysis..." + reset)
	allFiles, err := findAllGoFiles()
	if err != nil {
		fmt.Println(red, "Error:", err, reset)
		os.Exit(1)
	}

	var totalCoveredLines float64
	var totalLines int

	for _, file := range allFiles {
		modulePath, sourceFile := filepath.Split(file)
		testFile := strings.TrimSuffix(sourceFile, ".go") + "_test.go"

		moduleName := getModuleName(file)                   // Get the container name
		header := centerAlignHeader(moduleName, sourceFile) // Now pass moduleName instead of modulePath
		fmt.Println(cyan + header + reset)

		loc, err := countLinesOfCode(filepath.Join(modulePath, sourceFile))
		if err != nil {
			fmt.Println(red, "Error counting LOC:", err, reset)
			continue
		}
		totalLines += loc

		if _, err := os.Stat(filepath.Join(modulePath, testFile)); err == nil {
			fmt.Println("Test file:", testFile)
			cmd := exec.Command("go", "test", "-v", "-cover", ".")
			cmd.Dir = modulePath
			out, err := cmd.CombinedOutput()
			output := string(out)
			if err != nil {
				fmt.Printf("%sError running tests for module %s: %v%s\n", red, modulePath, err, reset)
				printFailedTests(output)
			}

			coverage := extractCoverage(output)
			fmt.Println("Percent code covered by test:", colorCoverage(coverage))

			covFloat, err := strconv.ParseFloat(strings.TrimSuffix(coverage, "%"), 64)
			if err == nil {
				coveredLines := math.Round((covFloat / 100.0) * float64(loc))
				totalCoveredLines += coveredLines
				fmt.Printf("Total lines in file: %d, Covered lines: %d\n", loc, int(coveredLines))
			}
		} else {
			fmt.Println(red + "Test file: Not Found" + reset)
			fmt.Println("Percent code covered by test:", red+"0%"+reset)
			fmt.Printf("Total lines in file: %d, Covered lines: 0\n", loc)
		}
	}

	fmt.Println(cyan + "----------------------------------------" + reset)
	if totalLines > 0 {
		overallCoverage := (totalCoveredLines / float64(totalLines)) * 100
		fmt.Printf("\nOverall code coverage: %s%s\n", colorCoverage(fmt.Sprintf("%.2f%%", overallCoverage)), reset)
	} else {
		fmt.Println("\nNo valid coverage data to calculate overall percentage.")
	}
}

func centerAlignHeader(moduleName, sourceFile string) string {
	baseHeader := fmt.Sprintf("Running Test for %s - %s", moduleName, sourceFile)
	headerLength := 70
	if len(baseHeader) > headerLength {
		baseHeader = baseHeader[:headerLength] // Truncate if too long
	}
	totalDashes := headerLength - len(baseHeader)
	leftDashes := totalDashes / 2
	rightDashes := totalDashes - leftDashes
	return strings.Repeat("-", leftDashes) + baseHeader + strings.Repeat("-", rightDashes)
}

func findAllGoFiles() ([]string, error) {
	var files []string
	err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".go") && !strings.HasSuffix(info.Name(), "_test.go") && info.Name() != "testBackend.go" {
			files = append(files, path)
		}
		return nil
	})
	return files, err
}

func extractCoverage(output string) string {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "coverage:") && strings.Contains(line, "%") {
			fields := strings.Fields(line)
			for _, field := range fields {
				if strings.Contains(field, "%") {
					return field
				}
			}
		}
	}
	return "0%"
}

func getModuleName(path string) string {
	segments := strings.Split(filepath.Clean(path), string(os.PathSeparator))
	// Iterate through segments to find the index of "Containers"
	for i, segment := range segments {
		if segment == "Containers" && i+1 < len(segments) {
			return segments[i+1] // Return the next segment which is the container name
		}
	}
	return "Unknown" // Default case if the structure is not as expected
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
			fmt.Println(red + line + reset)
		}
	}
}

func colorCoverage(coverage string) string {
	covFloat, _ := strconv.ParseFloat(strings.TrimSuffix(coverage, "%"), 64)
	switch {
	case covFloat < 33:
		return red + coverage + reset
	case covFloat < 67:
		return yellow + coverage + reset
	case covFloat < 90:
		return green + coverage + reset
	default:
		return cyan + coverage + reset
	}
}
