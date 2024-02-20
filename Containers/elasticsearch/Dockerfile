
# Changed to latest version
FROM docker.elastic.co/elasticsearch/elasticsearch:8.12.1 

ENV discovery.type=single-node

#### 
# TODO: Ticket I027, Implement TLS between elasticsearch and fluentd
#   - Use environmental variable for access keys and passwords
#   - usernames and default users
#   - Remove flags below (disables TLS)
####
ENV xpack.security.enabled=false
ENV xpack.security.http.ssl.enabled=false
ENV xpack.security.transport.ssl.enabled=false

# TODO: Ticket I031, Volume mount elastic and kibana config
# COPY config/elasticsearch.yml /usr/share/elasticsearch/config/