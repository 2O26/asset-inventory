package main

import (

	"testing"
	"net/http/httptest"
	"net/http"

	"github.com/gin-gonic/gin"
)


func TestGetLatestState(t *testing.T) {

	/*TODO
	http.Get(url) -> Error Refuse connection
	json.NewDecoder(resp.Body).Decode(&scanResult) -> Error
	json.Marshal(scanResult) -> Error
	jsonhandler.BackToFront(json.RawMessage(scanResultJSON), nil) -> Error
	var authSuccess = true

	if authSuccess --> get to false??

	*/
	//fakeReq := httptest.NewRequest("GET", "", nil)

	testContext, _ := gin.CreateTestContext(httptest.NewRecorder())

	getLatestState(testContext)

	if testContext.Writer.Status() != http.StatusInternalServerError {
        t.Errorf("Expected status code %d but got %d", http.StatusInternalServerError, testContext.Writer.Status()) //Test with closed port 
    }

	//open port 

	getLatestState(testContext)

	if testContext.Writer.Status() != http.StatusInternalServerError {
        t.Errorf("Expected status code %d but got %d", http.StatusInternalServerError, testContext.Writer.Status()) //Test with closed port 
    }




}