package main

import (
	dbcon "assetinventory/cyclonedx/dbcon-cyclonedx"
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

func uploadCycloneDX(c *gin.Context) {
	// Limit the size of the request body to 10MB
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20)

	// Retrieve the file from the form data
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid file upload attempt",
		})
		return
	}

	if file.Header.Get("Content-Type") != "application/json" && file.Header.Get("Content-Type") != "text/xml" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Only JSON or XML files are allowed",
		})
		return
	}

	var sbomData []byte
	if file.Header.Get("Content-Type") == "application/xml" {
		// Convert XML to JSON
		stdin, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to open the file",
			})
			return
		}
		defer stdin.Close()

		cmd := exec.Command("cyclonedx", "--input-type", "xml", "--output-type", "json")
		out, err := cmd.Output()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to convert XML to JSON",
			})
			return
		}
		sbomData = out
	} else {
		// Read the JSON file content into a byte slice
		fileContent, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to open the file",
			})
			return
		}
		defer fileContent.Close()

		buf := bytes.NewBuffer(nil)
		if _, err := io.Copy(buf, fileContent); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read the file",
			})
			return
		}
		sbomData = buf.Bytes()
	}

	// Fetch the assetID from the POST request
	assetID := c.PostForm("assetID")

	// Log the file information
	fmt.Printf("Uploaded File: %+v\n", file.Filename)
	fmt.Printf("File Size: %+v\n", file.Size)
	fmt.Printf("MIME Header: %+v\n", file.Header)
	fmt.Printf("Asset ID: %s\n", assetID)

	// Save the SBOM data to the database
	db := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("SBOMS")}
	err = dbcon.SaveCycloneDX(db, sbomData, assetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save SBOM to database",
		})
		return
	}

	// Respond to the client
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("File uploaded successfully: %s", file.Filename),
	})
}

// func uploadCycloneDX(c *gin.Context) {
// 	// Limit the size of the request body to 10MB
// 	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20)

// 	// Retrieve the file from the form data
// 	file, err := c.FormFile("file")
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "Invalid file upload attempt",
// 		})
// 		return
// 	}

// 	if file.Header.Get("Content-Type") != "application/json" {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "Only JSON files are allowed",
// 		})
// 		return
// 	}
// 	// Fetch the assetID from the POST request
// 	assetID := c.PostForm("assetID")

// 	// Log the file information
// 	fmt.Printf("Uploaded File: %+v\n", file.Filename)
// 	fmt.Printf("File Size: %+v\n", file.Size)
// 	fmt.Printf("MIME Header: %+v\n", file.Header)
// 	fmt.Printf("Asset ID: %s\n", assetID) // Print the assetID

// 	// Read the file content into a byte slice
// 	fileContent, err := file.Open()
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "Failed to open the file",
// 		})
// 		return
// 	}
// 	defer fileContent.Close()

// 	buf := bytes.NewBuffer(nil)
// 	if _, err := io.Copy(buf, fileContent); err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "Failed to read the file",
// 		})
// 		return
// 	}
// 	// Save the SBOM data to the database
// 	sbomData := buf.Bytes()
// 	db := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("SBOMS")}
// 	err = dbcon.SaveCycloneDX(db, sbomData, assetID)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "Failed to save SBOM to database",
// 		})
// 		return
// 	}
// 	// Respond to the clientS
// 	c.JSON(http.StatusOK, gin.H{
// 		"message": fmt.Sprintf("File uploaded successfully: %s", file.Filename),
// 	})
// }

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func main() {

	router := gin.Default()
	// Apply the CORS middleware
	router.Use(CORSMiddleware())

	err := dbcon.SetupDatabase("mongodb://cyclonedxstorage:27020/", "SBOM")
	if err != nil {
		log.Fatalf("Could not set up database: %v", err)
	}
	router.POST("/uploadCycloneDX", uploadCycloneDX)
	sbomHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("SBOMS")}

	router.GET("/getCycloneDXFile", func(c *gin.Context) {
		dbcon.GetCycloneDXFile(sbomHelper, c)
	})
	router.GET("/PrintAllDocuments", func(c *gin.Context) {
		dbcon.PrintAllDocuments(sbomHelper, c)
	})

	router.GET("/DeleteAllDocuments", func(c *gin.Context) {
		dbcon.DeleteAllDocuments(sbomHelper, c)
	})
	//sbomHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("SBOMS")}
	log.Println("Server starting on port 8082...")
	if err := router.Run(":8082"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

}
