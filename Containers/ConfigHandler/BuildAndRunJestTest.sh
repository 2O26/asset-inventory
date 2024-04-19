docker build --file DockerfileTest . -t jesttest
docker run --name my-jesttest-container -p 3001:3001 jesttest
# docker stop my-jesttest-container

