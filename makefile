.PHONY: all assInvFront assetHandler networkScan fluentd elasticsearch kibana frontendDev cypresslocal dev run down clean cypress-test environment-test frontend-dev configHandler keycloakLocal cyclonedx

all: assInvFront assetHandler networkScan fluentd elasticsearch kibana cypresslocal configHandler keycloakLocal cyclonedx

all-dev: assetHandler networkScan frontendDev configHandler keycloakLocal cyclonedx

all-test: assetHandler networkScan frontendDev configHandler cypresslocal keycloakLocal cyclonedx

assInvFront:
	docker build -t assinvfront ./Containers/FrontEnd

frontendDev:
	cd ./Containers/FrontEnd/ && docker build --file DockerfileDev -t frontenddev .

cyclonedx:
	docker build -t cyclonedx ./Containers/CycloneDX

assetHandler:
	docker build -t assethandler ./Containers/AssetHandler

networkScan:
	docker build -t networkscan ./Containers/NetworkScan

configHandler:
	docker build -t confighandler ./Containers/ConfigHandler

keycloakLocal:
	docker build -t keycloak_local ./Containers/keycloak

fluentd:
	docker build -t fluentd ./Containers/fluentd

elasticsearch:
	docker build -t elasticsearch ./Containers/elasticsearch

kibana:
	docker build -t kibana ./Containers/kibana

cypresslocal:
	docker build -t cypresslocal ./Containers/Cypress

dev:
	docker compose -f dev-docker-compose.yaml up
	open http://localhost:3000/

test:
	docker compose -f test-docker-compose.yaml up

run:
	docker compose -f docker-compose.yaml up --compatibility -d
	open http://localhost:80/

down:
	docker compose -f docker-compose.yaml down
	docker compose -f dev-docker-compose.yaml down
	docker compose -f test-docker-compose.yaml down

clean:
	docker rmi --force assinvfront assethandler networkscan fluentd elasticsearch kibana confighandler frontenddev keycloakLocal cyclonedx
