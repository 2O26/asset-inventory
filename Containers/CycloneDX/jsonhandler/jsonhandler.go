package jsonhandler

import (
	"encoding/json"
	"fmt"
	"time"
)

// Metadata represents the metadata section of CycloneDX v1.2.
type Metadata struct {
	Timestamp time.Time `json:"timestamp,omitempty"`
	Tools     []Tool    `json:"tools,omitempty"`
	Authors   []Author  `json:"authors,omitempty"`
	Component Component `json:"component,omitempty"`
}

// Tool represents a tool used within the metadata section.
type Tool struct {
	Vendor  string `json:"vendor,omitempty"`
	Name    string `json:"name,omitempty"`
	Version string `json:"version,omitempty"`
}

// Author represents an author of the component.
type Author struct {
	Name  string `json:"name,omitempty"`
	Email string `json:"email,omitempty"`
}

// Component represents a software component in CycloneDX.
type Component struct {
	Type    string `json:"type"`
	Name    string `json:"name"`
	Version string `json:"version"`
	Purl    string `json:"purl"`
	// v1.2 supports sub-components
	Components []Component `json:"components,omitempty"`
}

// License represents the license of a component.
type License struct {
	Name string `json:"name,omitempty"`
}

// CycloneDX represents the root of a CycloneDX document according to v1.2.
type CycloneDX struct {
	BomFormat   string      `json:"bomFormat"`
	SpecVersion string      `json:"specVersion"`
	Version     int         `json:"version"`
	Metadata    Metadata    `json:"metadata,omitempty"`
	Components  []Component `json:"components,omitempty"`
}

type ReducedSBOM struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

func ConvertToJSON(in []byte) ([]byte, error) {
	var cycloneDX CycloneDX
	err := json.Unmarshal(in, &cycloneDX)
	if err != nil {
		fmt.Printf("Error unmarshalling input bytes: %v\n", err)
		return in, fmt.Errorf("Error unmarshalling input bytes: %v\n", err)
	}

	// Marshal the CycloneDX document into JSON.
	SBOMJSON, err := json.MarshalIndent(cycloneDX, "", "  ")
	if err != nil {
		return SBOMJSON, fmt.Errorf("Error marshaling to JSON: %v\n", err)
	}
	return SBOMJSON, nil
}

func reduceToLibraries(SBOMjson []byte) ([]byte, error) {
	return SBOMjson, nil
}

func InsertNewSBOMdata(in []byte, out []byte) {
	fmt.Printf("Hello world")
}
