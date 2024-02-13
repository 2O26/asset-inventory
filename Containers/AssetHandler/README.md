## How to add module from external source
Run in your local terminal
> go mod init <dependency name>

This adds the required data to go.mod and go.sum. The dockerfile will now be able to download and compile required dependencies.
