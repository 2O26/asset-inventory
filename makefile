all: assInvFront assetHandler networkScan fluentd elasticsearch kibana cypress

assInvFront:
	cd ./Containers/FrontEnd && docker build -t assinvfront .

assetHandler:
	cd ./Containers/AssetHandler && docker build -t assethandler .

networkScan:
	cd ./Containers/NetworkScan && docker build -t networkscan .

fluentd:
	cd ./Containers/fluentd && docker build -t fluentd .

elasticsearch:
	cd ./Containers/elasticsearch && docker build -t elasticsearch .

kibana:
	cd ./Containers/kibana && docker build -t kibana .

run:
	docker compose -f docker-compose.yaml up -d && open http://localhost:3000/

down:
	docker compose -f docker-compose.yaml down

clean:
	docker rmi --force assinvfront assethandler networkscan fluentd elasticsearch kibana

cypress-test:
	cd CyprestTests/cypress && npm run cy:run

enviroment-test:
	curl localhost:89