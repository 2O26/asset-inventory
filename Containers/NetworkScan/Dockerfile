##
# Golang docker build
# https://docs.docker.com/language/golang/build-images/
##

FROM golang:alpine as builder
# FROM golang:alpine AS build-stage
WORKDIR /app
# go.mod : describes modules properties, including dependencies on other modules and on versions on Go
# go.sum : file contains cryptographic hashes for each module version that your project depends on. (maintains integrity and reproducibility)
COPY go.mod go.sum ./ 
# install the Go modules necessary to compile it.
RUN go mod download 
# Copy source code to container
COPY *.go ./
# Compile the application
RUN CGO_ENABLED=0 GOOS=linux go build -o ./networkscan
# Expose port 8080 (the port that the API is listening to)

# Use a minimal Alpine image for the final container
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

#Install nmap
RUN apk add --no-cache nmap nmap-scripts lua5.3
RUN apk add nmap

# Copy the executable from the builder that way we have only what is needed at runtime
COPY --from=builder /app/networkscan .

EXPOSE 8081
# Run the binary 
ENTRYPOINT ["./networkscan"] 


