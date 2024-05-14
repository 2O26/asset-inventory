package main

import (
	"assetinventory/assethandler/dbcon"
	//"assetinventory/assethandler/jsonhandler"
	//"errors"
	"testing"
	"fmt"
	"net/http/httptest"
	"net/http"
	"time"
	"log"
	//"os"
	//"strings"
	//"bytes"
	//"net/url"
	"context"

	"encoding/json"
	"github.com/gin-gonic/gin"
	//"go.mongodb.org/mongo-driver/bson/primitive"
	//"github.com/stretchr/testify/assert"
	//"github.com/stretchr/testify/mock"
	//"go.mongodb.org/mongo-driver/bson"
	//"go.mongodb.org/mongo-driver/bson/primitive"
	//"go.mongodb.org/mongo-driver/mongo"
)

type Person struct {
	Name string
	Age  int
	// Assume the response includes a field with an unsupported data type
	ExtraInfo func()
}

/*func Perform(fn func() (json.RawMessage), x json.RawMessage) (err error){
	defer func() {
		if r := recover(); r != nil {
			err = r.(error)
		}
	}()
	x = fn()
	return
}*/

func TestCORSMiddleware(t *testing.T) {
	
	router := gin.New()
	router.Use(CORSMiddleware())

	router.GET("/status", func(c *gin.Context) {
        c.String(http.StatusOK, "Hello, world!")
    })

	request := httptest.NewRequest("OPTIONS", "http://networkscan:8081/status", nil)
	respRec := httptest.NewRecorder()

	router.ServeHTTP(respRec, request)

	headers := respRec.Result().Header
    expectedHeaders := map[string]string{
        "Access-Control-Allow-Origin":      "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers":    "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With",
        "Access-Control-Allow-Methods":    "POST, OPTIONS, GET, PUT",
    }
	for key, value := range expectedHeaders {
		if got := headers.Get(key); got != value {
			t.Errorf("expected %s header to be %s, got %s", key, value, got)
		}
	}
	fmt.Println("Test CORSMiddleware *SUCCESSFUL*")
}

func TestGetNetworkScan(t *testing.T) {
	dbcon.SetupDatabase("mongodb://localhost:27017/","TestDB")
	router1 := gin.Default()
	router1.Use(CORSMiddleware())
	//mockDB := new(mock.Mock)
	//mockDB.On("InsertOne", mock.Anything, mock.AnythingOfType("PluginState")).Return(&mongo.InsertOneResult{}, nil)
	//scansHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("scans")}
	//addInitialScan(scansHelper)
	testResp := networkResponse{
		StateID:     "123",
		DateCreated: "2024-04-11",
		DateUpdated: "2024-04-12",
		State: map[string]networkAsset{
			"asset1": {
            Status:    "active",
            IPv4Addr:  "192.168.1.1",
            Subnet:    "255.255.255.0",
            OpenPorts: []int{80, 443},
			},
			"asset2": {
            Status:    "active",
            IPv4Addr:  "192.168.1.2",
            Subnet:    "255.255.255.0",
            OpenPorts: []int{81, 423},
			},
		},
	}
	router1.GET("/GetLatestScan", func(c *gin.Context) {
		c.JSON(http.StatusOK, testResp)
	})
	log.Println("Server starting on port 8081...")


    server1 := &http.Server{
        Addr:    ":8081",
        Handler: router1,
    }

    go func() {
        if err := server1.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            t.Fatalf("failed to start server1: %v", err)
        }
    }()

	time.Sleep(2 * time.Second)
	//getNetworkScan("http://localhost:8081/GetLatestScan")


	getNetworkScan("http://localhost:8081/GetLatestScan")


	//error := Perform(getNetScanStatus, JsonTestMsg)
	if err := server1.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }
	/*if err := server1.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }*/

}

func TestGetLatestState(t *testing.T) {
	dbcon.SetupDatabase("mongodb://localhost:27017/","TestDB")

	//fakeReq := httptest.NewRequest("GET", "", nil)
	writer := httptest.NewRecorder()
	testContext, _ := gin.CreateTestContext(writer)

	//http.Get(url) -> Error Refuse connection
	router := gin.Default()
	router.Use(CORSMiddleware())
    router.GET("/GetLatestScan", func(c *gin.Context) {
        c.String(http.StatusOK, "This is a test response")
    })

    server := &http.Server{
        Addr:    ":8081",
        Handler: router,
    }

    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            t.Fatalf("failed to start server: %v", err)
        }
    }()
	time.Sleep(2 * time.Second)

	getLatestState(testContext)
	expectedMsg := `{"error":"Failed to get latest scan"}`

	if testContext.Writer.Status() != http.StatusInternalServerError {
        t.Errorf("Expected status code %d but got %d", http.StatusInternalServerError, testContext.Writer.Status()) //Test with closed port 
    }
	if expectedMsg != writer.Body.String() {
		t.Errorf("Expected status code %s but got %s", expectedMsg, writer.Body.String())
	}

	if err := server.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }

	//open port 
	// Start a test server listening on port 8080
		responseBody := json.RawMessage(`
		{
			"stateID": "20240417-1400B",
			"dateCreated": "2024-02-30 23:00:00",
			"dateUpdated": "2024-02-31 23:00:30",
			"state": {
				"AID_4123523": {
					"OS": "Windows XP"
				}
			}
		}`)

    router = gin.Default()
	router.Use(CORSMiddleware())
    router.GET("/GetLatestScan", func(c *gin.Context) {
        c.String(http.StatusOK, "This is a test response")
    })

    server = &http.Server{
        Addr:    ":8080",
        Handler: router,
    }

	router1 := gin.Default()
	router1.Use(CORSMiddleware())
    router1.GET("/GetLatestScan", func(c *gin.Context) {
        respReader := responseBody
		c.JSON(http.StatusOK, respReader)
    })

    server1 := &http.Server{
        Addr:    ":8081",
        Handler: router1,
    }

    go func() {
        if err := server1.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            t.Fatalf("failed to start server1: %v", err)
        }
    }()

    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            t.Fatalf("failed to start server: %v", err)
        }
    }()
	
	//json.NewDecoder(resp.Body).Decode(&scanResult) -> Error
	writer = httptest.NewRecorder()
	testContext, _ = gin.CreateTestContext(writer)
	
	time.Sleep(3 * time.Second)
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
	if err := server1.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }

	//json.Marshal(scanResult) -> Error
	/*
	router = gin.Default()
	router.Use(CORSMiddleware())
    router.GET("/GetLatestScan", func(c *gin.Context) {
	// Create a scan result with an unsupported field type`
		respReader := responseBody
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
		//ROUTER SERVER 8081    
	router1 = gin.Default()
	router1.Use(CORSMiddleware())
    router1.GET("/GetLatestScan", func(c *gin.Context) {
        respReader := responseBody
		c.JSON(http.StatusOK, respReader)
    })

    server1 = &http.Server{
        Addr:    ":8081",
        Handler: router1,
    }

    go func() {
        if err := server1.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            t.Fatalf("failed to start server1: %v", err)
        }
    }()

	time.Sleep(2 * time.Second)
	writer = httptest.NewRecorder()
	testContext, _ = gin.CreateTestContext(writer)
	getLatestState(testContext)
	expectedMsg = `{"error":"Failed to prepare scan data"}`
	/*
	if testContext.Writer.Status() != http.StatusInternalServerError {
        t.Errorf("Expected status code %d but got %d", http.StatusInternalServerError, testContext.Writer.Status()) 
    }
	if expectedMsg != writer.Body.String() {
		t.Errorf("Expected status code %s but got %s", expectedMsg, writer.Body.String())
	}*/
	


	// Manually stop the Gin server
    if err := server.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }
	if err := server1.Shutdown(context.Background()); err != nil {
        t.Fatalf("failed to shutdown server: %v", err)
    }
	
}
