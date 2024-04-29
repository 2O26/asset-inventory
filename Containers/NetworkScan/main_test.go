package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
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
		{"0.255.255.255", true},
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
		if valid != test.result {
			t.Errorf("nmap Target: %s is %t it should be %t", test.target, valid, test.result)
		}
	}
}

func TestCORSMiddleware(t *testing.T) {
	router := gin.New()
	router.Use(CORSMiddleware())

	router.GET("/test-cors", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Test preflight request
	w := httptest.NewRecorder()
	req, err := http.NewRequest("OPTIONS", "/test-cors", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	router.ServeHTTP(w, req)

	// Check the status code for OPTIONS request
	if w.Code != http.StatusNoContent {
		t.Errorf("Expected HTTP status %d for OPTIONS request, got %d", http.StatusNoContent, w.Code)
	}

	// Test simple GET request
	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/test-cors", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	router.ServeHTTP(w, req)

	// Check the status code for GET request
	if w.Code != http.StatusOK {
		t.Errorf("Expected HTTP status %d for GET request, got %d", http.StatusOK, w.Code)
	}

	// Check CORS headers
	headers := w.Header()
	if headers.Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("Expected Access-Control-Allow-Origin header to be '*', got '%s'", headers.Get("Access-Control-Allow-Origin"))
	}
	if headers.Get("Access-Control-Allow-Credentials") != "true" {
		t.Errorf("Expected Access-Control-Allow-Credentials header to be 'true', got '%s'", headers.Get("Access-Control-Allow-Credentials"))
	}
	if headers.Get("Access-Control-Allow-Headers") != "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With" {
		t.Errorf("Expected Access-Control-Allow-Headers header to be '%s', got '%s'", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With", headers.Get("Access-Control-Allow-Headers"))
	}
	if headers.Get("Access-Control-Allow-Methods") != "POST, OPTIONS, GET, PUT" {
		t.Errorf("Expected Access-Control-Allow-Methods header to be 'POST, OPTIONS, GET, PUT', got '%s'", headers.Get("Access-Control-Allow-Methods"))
	}
}
