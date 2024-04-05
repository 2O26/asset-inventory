ARG REPO=mcr.microsoft.com/dotnet/aspnet
FROM $REPO:8.0.3-alpine3.19-amd64 as cyclonedx-builder
ENV \
    # Do not generate certificate
    DOTNET_GENERATE_ASPNET_CERTIFICATE=false \
    # Do not show first run text
    DOTNET_NOLOGO=true \
    # SDK version
    DOTNET_SDK_VERSION=8.0.203 \
    # Disable the invariant mode (set in base image)
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    # Enable correct mode for dotnet watch (only mode supported in a container)
    DOTNET_USE_POLLING_FILE_WATCHER=true \
    # Skip extraction of XML docs - generally not useful within an image/container - helps performance
    NUGET_XMLDOC_MODE=skip \
    # PowerShell telemetry for docker image usage
    POWERSHELL_DISTRIBUTION_CHANNEL=PSDocker-DotnetSDK-Alpine-3.19

RUN apk add --upgrade --no-cache \
    curl \
    git \
    icu-data-full \
    icu-libs \
    tzdata

# Install .NET SDK
RUN wget -O dotnet.tar.gz https://dotnetcli.azureedge.net/dotnet/Sdk/$DOTNET_SDK_VERSION/dotnet-sdk-$DOTNET_SDK_VERSION-linux-musl-x64.tar.gz \
    && dotnet_sha512='d2b6d8b411470c1a856d546dea087285dad7adb3b3fc5335b024d6f9054ac869073742c283158294c7b866dbd58dda4d9fa2a2c245fb4618c44ca5a61ddec7da' \
    && echo "$dotnet_sha512  dotnet.tar.gz" | sha512sum -c - \
    && mkdir -p /usr/share/dotnet \
    && tar -oxzf dotnet.tar.gz -C /usr/share/dotnet ./packs ./sdk ./sdk-manifests ./templates ./LICENSE.txt ./ThirdPartyNotices.txt \
    && rm dotnet.tar.gz \
    # Trigger first run experience by running arbitrary cmd
    && dotnet help

# Install PowerShell global tool
RUN powershell_version=7.4.1 \
    && wget -O PowerShell.Linux.Alpine.$powershell_version.nupkg https://powershellinfraartifacts-gkhedzdeaghdezhr.z01.azurefd.net/tool/$powershell_version/PowerShell.Linux.Alpine.$powershell_version.nupkg \
    && powershell_sha512='c9e173a29e72e80e047b7bf719ed2796d4250ac534e7af833580f0193ff804896a327e51c5fa1f4aa3635fe5b3ce6bdec2ec7eb536f25e3650b36ea5591afa40' \
    && echo "$powershell_sha512  PowerShell.Linux.Alpine.$powershell_version.nupkg" | sha512sum -c - \
    && mkdir -p /usr/share/powershell \
    && dotnet tool install --add-source / --tool-path /usr/share/powershell --version $powershell_version PowerShell.Linux.Alpine \
    && dotnet nuget locals all --clear \
    && rm PowerShell.Linux.Alpine.$powershell_version.nupkg \
    && ln -s /usr/share/powershell/pwsh /usr/bin/pwsh \
    && chmod 755 /usr/share/powershell/pwsh \
    # To reduce image size, remove the copy nupkg that nuget keeps.
    && find /usr/share/powershell -print | grep -i '.*[.]nupkg$' | xargs rm \
    # Add ncurses-terminfo-base to resolve psreadline dependency
    && apk add --no-cache ncurses-terminfo-base

WORKDIR /root/

RUN apk add --no-cache git

RUN git clone https://github.com/CycloneDX/cyclonedx-cli.git
WORKDIR ./cyclonedx-cli
RUN dotnet publish src/cyclonedx/cyclonedx.csproj --configuration Release --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesInSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true --output bin/linux-x64

FROM golang:1.22.0-alpine as go-builder
WORKDIR /app
# go.mod : describes modules properties, including dependencies on other modules and on versions on Go
# go.sum : file contains cryptographic hashes for each module version that your project depends on. (maintains integrity and reproducibility)
COPY go.mod go.sum ./
COPY ./dbcon-cyclonedx ./dbcon-cyclonedx
# install the Go modules necessary to compile it.
RUN go mod download
# Copy source code to container
COPY *.go ./

COPY --from=cyclonedx-builder /root/cyclonedx-cli/bin/linux-x64 /bin
COPY ./bom.xml ./bom.xml
RUN apk add --no-cache icu 
# python3 \
# py3-pip \
# && python3 -m venv /opt/cve-bin-tool-venv \
# && /opt/cve-bin-tool-venv/bin/pip install --upgrade pip \
# && /opt/cve-bin-tool-venv/bin/pip install cve-bin-tool \
# && /opt/cve-bin-tool-venv/bin/pip install gsutil 

# Compile the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /cyclonedx


FROM python:3.8-slim-buster 

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 

WORKDIR /app

COPY --from=cyclonedx-builder /root/cyclonedx-cli/bin/linux-x64 /bin
COPY --from=go-builder /cyclonedx /cyclonedx

RUN python -m pip install cve-bin-tool

RUN python -m cve_bin_tool.cli -u now -e / / --disable-data-source OSV


#CMD ["/bin/bash"]


#RUN pip3 install --no-cache-dir --upgrade pip
#RUN pip3 install --no-cache-dir cve-bin-tool
# Expose port 8082 (the port that the API is listening to)
EXPOSE 8082

ENTRYPOINT ["/cyclonedx"]

# FROM golang:1.22.0-alpine

# WORKDIR /app
# COPY --from=cyclonedx-builder /root/cyclonedx-cli/bin/linux-x64 /bin
# # COPY ./bom.json ./bom.json
# # COPY ./bom.xml ./bom.xml


# ENTRYPOINT ["python3", "-m", "http.server", "8082"]