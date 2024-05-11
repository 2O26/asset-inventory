package main

import (

	"testing"
    "reflect"
    "time"
    "dbcon"
)

func TestValidNmapTarget(t *testing.T) {
     tests := []struct {
	      target string
		  result bool
	 }{
		  {"192.168.1.49", true},
		  {"192.168.1.0/24", true},
		  {"172.15.1.1-100", true},
		  {"10.10.1.145", true},
		  {"0.0.0.0", true},
		  {"0.255.255.255",true},
		  {"10.0.0.0/8", true},
		  {"1.0.0.0", true},
		  {"172.15.1.1-172.15.1.100", false},
		  {"a string", false},
		  {"a.st.ri.ng", false},
		  {"a.st.ri.ng/24", false},
		  {"a.st.ri.ng-100", false},
		  {"", false},
		  {"2001:db8::1", false},
		  {"`172.15.1.1-100` ; DROP TABLE users; -- ", false},
	 }

	 for _, test := range tests {
		  valid := validNmapTarget(test.target)
		  if valid != test.result{
				t.Errorf("nmap Target: %s is %t it should be %t", test.target, valid, test.result)
		  }
	 }
}


func TestPerformSimpleScan(t *testing.T) {
    // Define a test case
    testCase := struct {
        target string
    }{
        target: "127.0.0.1", // Use localhost as the target
    }

    // Call the function with the test case
    scan, err := performSimpleScan(testCase.target)

    // Check for unexpected errors
    if err != nil {
        t.Fatalf("performSimpleScan() returned an error: %v", err)
    }

    // Check the scan object
    if scan.StateID != "" {
        t.Errorf("Unexpected StateID: got %v, want %v", scan.StateID, "")
    }

    // Parse the date strings
    dateCreated, err := time.Parse(time.RFC3339, scan.DateCreated)
    if err != nil {
        t.Fatalf("Failed to parse DateCreated: %v", err)
    }
    dateUpdated, err := time.Parse(time.RFC3339, scan.DateUpdated)
    if err != nil {
        t.Fatalf("Failed to parse DateUpdated: %v", err)
    }

    // Check the dates
    if !dateCreated.Before(time.Now()) {
        t.Errorf("DateCreated is not before current time")
    }
    if !dateUpdated.Before(time.Now()) {
        t.Errorf("DateUpdated is not before current time")
    }

    // Check the state map
    if !reflect.DeepEqual(scan.State, make(map[string]dbcon.Asset)) {
        t.Errorf("Unexpected State: got %v, want %v", scan.State, make(map[string]dbcon.Asset))
    }
}