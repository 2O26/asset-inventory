package main

import (
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "strings"
)

func main() {
    // List all directories containing Go code
    modules, err := findModules()
    if err != nil {
        fmt.Println("Error:", err)
        os.Exit(1)
    }

    if len(modules) == 0 {
        fmt.Println("No Go modules found.")
        os.Exit(0)
    }

    // Run tests with coverage for each module

    for _, module := range modules {
        fmt.Println("\nRunning tests for module:", module)
        cmd := exec.Command("go", "test", "-cover", "./...")
        cmd.Dir = module
        out, err := cmd.CombinedOutput()
        if err != nil {
            fmt.Printf("Error running tests for module %s: %v\n", module, err)
        }
        // Extract coverage percentage from output
        coverage := extractCoverage(string(out))
        fmt.Print("percent code covered by test:", coverage)
    }
    fmt.Print("\nPlease note the percentage of code considered covered by tests is still counted even if the test fails.")
}

func findModules() ([]string, error) {
    var modules []string
    err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        if info.IsDir() && strings.Contains(path, "AssetHandler") {//Hard coded directories maybe temporary \_(^_^)_/
            modules = append(modules, path)
        }else if info.IsDir() && strings.Contains(path, "NetworkScan") && !strings.Contains(path, "FrontEnd"){
            modules = append(modules, path)
        }
        
        return nil
    })
    return modules, err
}

func extractCoverage(output string) string {
    lines := strings.Split(output, "\n")
    for _, line := range lines {
        if strings.Contains(line, "coverage:") && strings.Contains(line, "%") {
            //If the line contains both "coverage:" and "%", extract the coverage percentage
            fields := strings.Fields(line)
            for _, field := range fields {
                if strings.Contains(field, "%") {
                    return field
                }
            }
        }
    }
    return ""//return empty string after the percentage
}