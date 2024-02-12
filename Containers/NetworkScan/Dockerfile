##
# Golang docker build
# https://docs.docker.com/language/golang/build-images/
##

FROM golang:latest
# FROM golang:latest AS build-stage
WORKDIR /app
# go.mod : describes modules properties, including dependencies on other modules and on versions on Go
# go.sum : file contains cryptographic hashes for each module version that your project depends on. (maintains integrity and reproducibility)
COPY go.mod go.sum ./ 
# install the Go modules necessary to compile it.
RUN go mod download 
# Copy source code to container
COPY *.go ./
# Compile the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /networkscan
# Expose port 8080 (the port that the API is listening to)
EXPOSE 8081
# Run the binary 
ENTRYPOINT ["/networkscan"] 


