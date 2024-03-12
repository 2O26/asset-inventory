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
# Copy the jsonhandler and dbcon
COPY ./jsonhandler ./jsonhandler
COPY ./dbcon ./dbcon
# install the Go modules necessary to compile it.
RUN go mod download 
# Copy source code to container
COPY *.go ./

# Run tests for jsonhandler and dbcon
RUN go test assetinventory/... -v

# Compile the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /assethandler
# Expose port 8080 (the port that the API is listening to)
EXPOSE 8080
# Run the binary 
ENTRYPOINT ["/assethandler"] 

# https://docs.docker.com/language/golang/run-tests/
# # Run the tests in the container
# FROM build-stage AS run-test-stage
# RUN go test -v ./...

# # Deploy the application binary into a lean image
# FROM gcr.io/distroless/base-debian11 AS build-release-stage

# # Set the workdir in the lean deb image
# WORKDIR /

# # 
# COPY --from=build-stage /assethandler /assethandler


