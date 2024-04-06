FROM quay.io/keycloak/keycloak:latest as builder

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_DB=postgres

WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:latest
COPY --from=builder /opt/keycloak/ /opt/keycloak
# Set environment variables for Keycloak
ENV KC_DB=postgres
ENV KC_DB_URL=jdbc:postgresql://db:5432/keycloak
ENV KC_DB_USERNAME=keycloak
ENV KC_DB_PASSWORD=password
ENV KC_HTTPS_PORT=8443
ENV KC_HTTP_PORT=8085
ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin
# makeTheDevelopersLifesH4RDbySettingAwaytoLongPassword!

# Copy custom themes or extensions if you have any
# For example, to add a custom theme:
# COPY ./themes/mytheme /opt/jboss/keycloak/themes/mytheme
COPY ./themes/custom /opt/keycloak/themes/custom

# If you have custom providers or CLI scripts, you can copy them as well
# COPY ./providers/* /opt/jboss/keycloak/standalone/deployments/

# Use the entry point provided by the base image
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
# # Expose the ports Keycloak runs on
# EXPOSE 8085 8443

# Start Keycloak
CMD ["start-dev"]
