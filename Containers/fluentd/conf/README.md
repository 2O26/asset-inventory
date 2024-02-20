This is a directory that will be mounted to the fluentd container via docker-compose.
It is mapped as: 
> ./fluentd/conf:/fluentd/etc 

Be aware that the docker logging driver does not support sub-second precision!

# Elasticsearch
Language clients are forward compatible; meaning that clients support communicating with greater or equal minor versions of Elasticsearch. Elasticsearch language clients are only backwards compatible with default distributions and without guarantees made.

## SSL/TLS
For fluentd to be able to speak to elasticsearch it needs to use HTTPS or else elasticsearch will reject the packages.
In addition, one needs to set username and password to be able to authenticate to the search service.

Currently SSL/TLS is disabled between the fluentd and elasticsearch environment. This ought to be fixed as soon as possible.

# Kibana + elasticsearch
For the elastic and kibana services to start properly it takes a considerble amount of time (about 30s). This results in the fluentd to produce error messages in the beginning. Thus, if you see Errors, be patient...


