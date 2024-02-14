all: assInvFront assetHandler networkScan

assInvFront:
	cd ./Containers/FrontEnd && docker build -t assinvfront .

assetHandler:
	cd ./Containers/AssetHandler && docker build -t assethandler .

networkScan:
	cd ./Containers/NetworkScan && docker build -t networkscan .
	
run:
	docker compose -f docker-compose.yaml up -d

open:
	open http://localhost:3000/

down:
	docker compose -f docker-compose.yaml down

clean:
	docker rmi --force assinvfront assethandler networkscan
