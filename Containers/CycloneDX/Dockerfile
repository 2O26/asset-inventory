FROM mcr.microsoft.com/dotnet/sdk:8.0 AS cyclonedx-builder

WORKDIR /root/

RUN git clone https://github.com/CycloneDX/cyclonedx-cli.git
WORKDIR ./cyclonedx-cli
RUN dotnet publish src/cyclonedx/cyclonedx.csproj --configuration Release --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesInSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true --output bin/

FROM golang:1.22.0-bookworm as go-builder
WORKDIR /app
# go.mod : describes modules properties, including dependencies on other modules and on versions on Go
# go.sum : file contains cryptographic hashes for each module version that your project depends on. (maintains integrity and reproducibility)
COPY go.mod go.sum ./
COPY ./dbcon-cyclonedx ./dbcon-cyclonedx
# install the Go modules necessary to compile it.
RUN go mod download
# Copy source code to container
COPY *.go ./

# COPY --from=cyclonedx-builder /root/cyclonedx-cli/bin/linux-x64 /bin
COPY ./bom.xml ./bom.xml

# Compile the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /cyclonedx


FROM python:3.8-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y libicu72
RUN python -m pip install cve-bin-tool
RUN python -m cve_bin_tool.cli -u now -e / / --disable-data-source OSV
COPY ./bom.json ./bom.json
COPY --from=cyclonedx-builder /root/cyclonedx-cli/bin /bin
COPY --from=go-builder /cyclonedx /cyclonedx

EXPOSE 8082

ENTRYPOINT ["/cyclonedx"]