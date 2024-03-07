.PHONY: all assInvFront assetHandler networkScan fluentd elasticsearch kibana frontendDev dev run down clean cypress-test environment-test frontend-dev

all: assInvFront assetHandler networkScan fluentd elasticsearch kibana cypress

all-dev: assetHandler networkScan frontendDev

all-dev: assetHandler networkScan frontendDev

assInvFront:
	docker build -t assinvfront ./Containers/FrontEnd

frontendDev:
	cd ./Containers/FrontEnd/ && docker build --file DockerfileDev -t frontenddev .

assetHandler:
	docker build -t assethandler ./Containers/AssetHandler

networkScan:
	docker build -t networkscan ./Containers/NetworkScan

fluentd:
	docker build -t fluentd ./Containers/fluentd

elasticsearch:
	docker build -t elasticsearch ./Containers/elasticsearch

kibana:
	docker build -t kibana ./Containers/kibana

dev:
	docker compose -f dev-docker-compose.yaml --compatibility up -d
	open http://localhost:3000/

run:
	docker compose -f docker-compose.yaml up -d
	open http://localhost:80/

down:
	docker compose -f docker-compose.yaml down
	docker compose -f dev-docker-compose.yaml down

clean:
	docker rmi --force assinvfront assethandler networkscan fluentd elasticsearch kibana

cypress-test:
	cd CyprestTests/cypress && npm run cy:run

environment-test:
	curl localhost:89