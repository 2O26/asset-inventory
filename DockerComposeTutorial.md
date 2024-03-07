# Installation
Follow the instructions to download docker (see other tutorial)

# Creating images
To create all docker images required to run the cluster, run:
```
make all
```

# Start cluster
To run the application with the log-server:
```
make run
```

To run the application without the log-server, and in Frontend in bind mount mode:
```
make dev
```

# Shutdown cluster

```
make down
```