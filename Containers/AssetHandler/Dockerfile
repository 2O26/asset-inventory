##
# Golang docker build
# https://docs.docker.com/language/golang/build-images/
##
#STAGE 1
FROM golang:alpine as builder
# FROM golang:alpine AS build-stage
WORKDIR /app
# go.mod : describes modules properties, including dependencies on other modules and on versions on Go
# go.sum : file contains cryptographic hashes for each module version that your project depends on. (maintains integrity and reproducibility)
COPY go.mod go.sum ./  
# Copy the jsonhandler
COPY ./jsonhandler ./jsonhandler
# install the Go modules necessary to compile it.
RUN go mod download 
# Copy source code to container
COPY *.go ./

# Compile the application
RUN CGO_ENABLED=0 GOOS=linux go build -o ./assethandler
#STAGE 2
# Use a minimal Alpine image for the final container
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the executable from the builder that way we have only what is needed at runtime
COPY --from=builder /app/assethandler .

# Expose port 8080 (the port that the API is listening to)
EXPOSE 8080
# Run the binary 
ENTRYPOINT ["./assethandler"] 

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


