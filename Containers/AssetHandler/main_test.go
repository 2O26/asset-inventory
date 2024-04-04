package main

import (
	//"assetinventory/assethandler/jsonhandler"

	//"errors"
	"testing"
	//"fmt"
	"net/http/httptest"
	"net/http"
	"time"
	//"strings"
	//"net/url"
	"context"

	"github.com/gin-gonic/gin"
)

type Person struct {
	Name string
	Age  int
	// Assume the response includes a field with an unsupported data type
	ExtraInfo func()
}


func TestGetLatestState(t *testing.T) {

	/*TODO
	jsonhandler.BackToFront(json.RawMessage(scanResultJSON), nil) -> Error
	var authSuccess = true

	if authSuccess --> get to false??

	*/
	//fakeReq := httptest.NewRequest("GET", "", nil)
	writer := httptest.NewRecorder()
	testContext, _ := gin.CreateTestContext(writer)

	//http.Get(url) -> Error Refuse connection

	getLatestState(testContext)
	expectedMsg := `{"error":"Failed to get latest scan"}`

	if testContext.Writer.Status() != http.StatusInternalServerError {
        t.Errorf("Expected status code %d but got %d", http.StatusInternalServerError, testContext.Writer.Status()) //Test with closed port 
    }
	if expectedMsg != writer.Body.String() {
		t.Errorf("Expected status code %s but got %s", expectedMsg, writer.Body.String())
	}

	//open port 
	// Start a test server listening on port 8080
    router := gin.Default()
    router.GET("/GetLatestScan", func(c *gin.Context) {
        c.String(http.StatusOK, "This is a test response")
    })

    server := &http.Server{
        Addr:    ":8080",
        Handler: router,
    }

    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            t.Fatalf("failed to start server: %v", err)
        }
    }()
	time.Sleep(1 * time.Second)
	//json.NewDecoder(resp.Body).Decode(&scanResult) -> Error
	writer = httptest.NewRecorder()
	testContext, _ = gin.CreateTestContext(writer)
	getLatestState(testContext)
	expectedMsg = `{"error":"Failed to decode latest scan data"}`
	
	if testContext.Writer.Status() != http.StatusInternalServerError {
        t.Errorf("Expected status code %d but got %d", http.StatusInternalServerError, testContext.Writer.Status()) 
    }
	if expectedMsg != writer.Body.String() {
		t.Errorf("Expected status code %s but got %s", expectedMsg, writer.Body.String())
	}
	if err := server.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }
	
	//json.Marshal(scanResult) -> Error
	/*responseBody := `{"Name":"Alice","Age":30,"ExtraInfo":null}`
	
	router = gin.Default()
    router.GET("/GetLatestScan", func(c *gin.Context) {
	// Create a scan result with an unsupported field type`
		respReader := strings.NewReader(responseBody)
		c.JSON(http.StatusOK, respReader)
    })

    server = &http.Server{
        Addr:    ":8080",
        Handler: router,
    }
	go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            t.Fatalf("failed to start server: %v", err)
        }
    }()
	time.Sleep(1 * time.Second)
	writer = httptest.NewRecorder()
	testContext, _ = gin.CreateTestContext(writer)
	getLatestState(testContext)
	expectedMsg = `{"error":"Failed to prepare scan data"}`
	
	if testContext.Writer.Status() != http.StatusInternalServerError {
        t.Errorf("Expected status code %d but got %d", http.StatusInternalServerError, testContext.Writer.Status()) 
    }
	if expectedMsg != writer.Body.String() {
		t.Errorf("Expected status code %s but got %s", expectedMsg, writer.Body.String())
	}
	*/


	// Manually stop the Gin server
    if err := server.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }
	
}