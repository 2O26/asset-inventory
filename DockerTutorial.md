

# Install
## Linux
https://docs.docker.com/engine/install/

### Ubuntu
#### Uninstall legacy
```
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
```

#### Intall apt repo
```
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

#### Install
```
 sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Verify
sudo docker run hello-world


## Error messages
> ERROR: failed to solve: node:latest: failed to authorize: failed to fetch oauth token: unexpected status from POST request to

```
docker logout
```


# Building images
### Buildx
```
docker buildx install
```

### Build image
Navigate to the folder where you have the Dockerfile for the microservice.
```
docker build -t <container_tag> .
```

### Build all images with one command
If you are lazy and don't want to build each microservice seperately you can use the make command in the root directory.

# Running single images
```
docker run -it -p 3000:3000 -w /app -v ./src:/app/src imagename
```
- The command above runs a container with the image name "imagename" (switch this to your container name)
- bind mounts to local directory. In other words, changes you make to code get updated to the container when you save your local file
- Workdirectory is set to /app


# How can I communicate between two docker images
We have decided to use REST APIs to communicate between containers. In other words, HTTP(S) messages sent between containers,e.g, POST or GET requests.  

# Cleaning up your computer
## Linux
```
docker image prune
docker system prune
```

# Install
## Windows


Download the installer at https://www.docker.com/products/docker-desktop/ 

Double-click Docker Desktop Installer.exe to run the installer. By default, Docker Desktop is installed at C:\Program Files\Docker\Docker.

When prompted,  choose to Use WSL 2 or Hyper-V option, the difference is WSL might not be supported by your system, but if it does  WSL is faster and has more commands

Follow the instructions on the installation wizard to authorize the installer and proceed with the install.

When the installation is successful, select Close to complete the installation process.

If your admin account is different to your user account, you must add the user to the docker-users group:

Run Computer Management as an administrator.

Navigate to Local Users and Groups > Groups > docker-users.

Right-click to add the user to the group.

Sign out and sign back in for the changes to take effect.

### Build all images with one command (Visual studio/other)

Windows does not have native support for the make command, however Visual studio does I can not speak on any other workarounds but I imagine they work the same way.

In visual studio if you are using it to manage the repository go to the menu at the top and under the "view" tab choose terminal. (alternatively the default shortcut to open the terminal is "Ctrl+ö")

If you are not using Visual Studio to manage the repository, navigate to the reposiotory folder right click the folder and choose "open with Visual Studio" and then open the terminal.

in the tab that opens use the command nmake.

# Building images / Running single images

Same commands as Linux (shown above)