# Build step 1: Build external application cyclonedx-cli
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS cyclonedx-builder
WORKDIR /root/
RUN git clone https://github.com/CycloneDX/cyclonedx-cli.git
WORKDIR /root/cyclonedx-cli
RUN dotnet publish src/cyclonedx/cyclonedx.csproj --configuration Release --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesInSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true --output bin/

# Build step 2: Install the go-code
FROM golang:1.22.0-bookworm as go-builder
WORKDIR /app
COPY go.mod go.sum ./
COPY ./dbcon-cyclonedx/go.mod ./dbcon-cyclonedx/go.sum ./dbcon-cyclonedx/
COPY ./jsonhandler/go.mod ./jsonhandler/go.sum ./jsonhandler/
COPY ./dbconn-libraryCVEs/go.mod ./dbconn-libraryCVEs/go.sum ./dbcon-libraryCVEs/
RUN go mod download
COPY ./dbcon-cyclonedx/*.go ./dbcon-cyclonedx/
COPY ./jsonhandler/*.go ./jsonhandler/
COPY ./dbconn-libraryCVEs/*.go ./dbconn-libraryCVEs/
COPY *.go ./
COPY ./bom.xml ./bom.xml
RUN CGO_ENABLED=0 GOOS=linux go build -o /cyclonedx

# Build step 3: Deploy the compiled binaries to a barebone container
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app/

COPY ./bom.json ./bom.json
COPY --from=cyclonedx-builder /root/cyclonedx-cli/bin /bin
COPY --from=go-builder /cyclonedx /cyclonedx

EXPOSE 8082

ENTRYPOINT ["/cyclonedx"]