# Installation
Follow the instructions to download docker tutorial

# Creating images
To create all docker images required to run the cluster with logs, run:
```
make all
```

To create all docker images required to run 'make dev':
```
make all-dev
```

Build developer environment (without log server, with test containers)
```
make all-test
```


# Start cluster
To run the application with the log-server and optimized build:
```
make run
```

To run the application without the log-server, and in Frontend in bind mount mode:
```
make dev
```

Deploy cypress tests:
```
make test
```

# Shutdown cluster

```
make down
```