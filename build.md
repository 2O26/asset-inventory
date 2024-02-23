# Building Asset-Inventory

## Prerequisites
- Docker installed and running on your machine.
- Node.js and npm installed (for Cypress tests: ```make cypress-test``` ).


## Using Make to Build and Run the Project

We use a `Makefile` to define our build and run processes. Here's how you can use it:

### Build All Components

To build all components of the project, simply run:

```bash
make
```
This command builds all the necessary Docker images for the project's services.

## Running the Project
To start all services using Docker Compose:

```bash
make run
```
This command will start all the containers in detached mode and open the front-end in your default web browser.

## Stopping the Project

To stop and remove all running containers:

```bash
make down
```

## Cleaning Up

To remove all Docker images created for this project:

```bash
make clean
```

## Running Tests

To run Cypress tests:

```bash
make cypress-test
```
To test environment is set up.

```bash
make environment-test
```
