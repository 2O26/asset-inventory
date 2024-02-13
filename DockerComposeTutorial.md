# Installation
Follow the instructions to download docker (see other tutorial)

# Creating images
To create all docker images required to run the cluster, run:
```
make all
```

# Start cluster 
```
docker compose -f docker-compose.yaml up
```

# Shutdown cluster
Find the directory in which the docker-compose file is located, and run 
```
docker compose -f docker-compose.yaml down
```
or
```
CTRL-C
```