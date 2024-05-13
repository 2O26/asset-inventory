package main

import (
	dbcon "assetinventory/cyclonedx/dbcon-cyclonedx"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/gin-gonic/gin"
)

type LibraryCVEreq struct {
	AssetID string `json:"assetID"`
}

type LibraryCVEresp struct {
	Success string `json:"response"`
}

func uploadCycloneDX(db dbcon.DatabaseHelper, c *gin.Context, auth dbcon.AuthResponse) {
	// Limit the size of the request body to 10MB
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20)

	if !auth.Authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	//check if user is able to upload sbom file
	if !auth.CanManageAssets && !auth.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid privileges for operation"})
		return
	}

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
	if file.Header.Get("Content-Type") == "text/xml" {
		// Convert XML to JSON
		stdin, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to open the file",
			})
			return
		}
		defer stdin.Close()

		// Save the uploaded file to disk temporarily
		dst := "./" + file.Filename
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to save the file",
			})
			return
		}
		defer os.Remove(dst) // Remove the temporary file after conversion

		cmd := exec.Command("cyclonedx", "validate", "--input-file", dst, "--input-version", "v1_2", "--fail-on-errors")
		fmt.Printf("Running command: %s\n", strings.Join(cmd.Args, " "))
		_, err = cmd.Output()
		if err != nil {
			fmt.Printf("cyclonedx command error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to validate file",
			})
			return
		}

		cmd = exec.Command("cyclonedx", "convert", "--input-format", "xml", "--input-file", dst, "--output-format", "json")
		fmt.Printf("Running command: %s\n", strings.Join(cmd.Args, " "))
		out, err := cmd.Output()
		if err != nil {
			fmt.Printf("cyclonedx command error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to convert XML to JSON",
			})
			return
		}
		sbomData = out
	} else {

		// Read the JSON file content into a byte slice
		stdin, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to open the file",
			})
			return
		}
		defer stdin.Close()

		dst := "./" + file.Filename
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to save the file",
			})
			return
		}
		defer os.Remove(dst) // Remove the temporary file after check

		cmd := exec.Command("cyclonedx", "validate", "--input-file", dst, "--input-version", "v1_2", "--fail-on-errors")
		fmt.Printf("Running command: %s\n", strings.Join(cmd.Args, " "))
		_, err = cmd.Output()
		if err != nil {
			fmt.Printf("cyclonedx command error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to validate file",
			})
			return
		}
		buf := bytes.NewBuffer(nil)
		if _, err := io.Copy(buf, stdin); err != nil {
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
	// db := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("SBOMS")}
	err = dbcon.SaveCycloneDX(db, sbomData, assetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save SBOM to database",
		})
		return
	}

	// Send POST request to cvescanner:3002/librarySort
	reqBody := LibraryCVEreq{
		AssetID: assetID,
	}
	reqBytes, err := json.Marshal(reqBody)
	if err != nil {
		fmt.Println("Error marshaling request body:", err)
		return
	}

	resp, err := http.Post("http://cvescanner:3002/libraryDBupdate", "application/json", bytes.NewBuffer(reqBytes))
	if err != nil {
		fmt.Println("Error making POST request:", err)
		return
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
		return
	}

	// Optionally, unmarshal the response body into a struct
	var respBody LibraryCVEresp
	if err := json.Unmarshal(body, &respBody); err != nil {
		fmt.Println("Error unmarshaling response body:", err)
		return
	}

	// Respond to the client
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("File uploaded successfully: %s", file.Filename),
	})
}

func removeCycloneDX(db dbcon.DatabaseHelper, c *gin.Context, auth dbcon.AuthResponse) {

	if !auth.Authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	//check if user is able to upload sbom file
	if !auth.CanManageAssets && !auth.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid privileges for operation"})
		return
	}

	assetID := c.PostForm("assetID")
	fmt.Printf("Asset ID: %s\n", assetID)

	// db := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("SBOMS")}
	err := dbcon.RemoveCycloneDX(db, assetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to remove SBOM from database.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("CycloneDX file removed."),
	})

}

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
	sbomHelper := &dbcon.MongoDBHelper{Collection: dbcon.GetCollection("SBOMS")}
	router.POST("/uploadCycloneDX", func(c *gin.Context) {
		auth := dbcon.AuthorizeUser(c)
		uploadCycloneDX(sbomHelper, c, auth)
	})
	// router.POST("/uploadCycloneDX", uploadCycloneDX)

	router.POST("/removeCycloneDX", func(c *gin.Context) {
		auth := dbcon.AuthorizeUser(c)
		removeCycloneDX(sbomHelper, c, auth)
	})

	router.GET("/getCycloneDXFile", func(c *gin.Context) {
		auth := dbcon.AuthorizeUser(c)
		if !auth.Authenticated {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		dbcon.GetCycloneDXFile(sbomHelper, c)
	})
	router.GET("/getCycloneDXFileInternal", func(c *gin.Context) {
		dbcon.GetCycloneDXFile(sbomHelper, c)
	})

	router.GET("/PrintAllDocuments", func(c *gin.Context) {
		dbcon.PrintAllDocuments(sbomHelper, c)
	})

	router.GET("/DeleteAllDocuments", func(c *gin.Context) {
		dbcon.DeleteAllDocuments(sbomHelper, c)
	})

	log.Println("Server starting on port 8082...")
	if err := router.Run(":8082"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

}
