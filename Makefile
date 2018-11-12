cnf ?= .env
#disable warnings
-include $(cnf)
export

ifdef CI_COMMIT_SHA
	BUILD_VERSION ?= $(CI_COMMIT_SHA)
else
	BUILD_VERSION ?= dev
endif

#define defaults (if not defined in .env)
PROJECT_NAME ?= kyrsantteam/board
DOCKER_REGISTRY_URL ?= kyrsant34.amazonaws.com
DOCKER_IMAGE ?= board-backend
DOCKER_BASE ?= board-backend-base
DOCKER_BASE_IMAGE := $(DOCKER_REGISTRY_URL)/$(DOCKER_BASE)
DOCKER_RELEASE_IMAGE := $(DOCKER_REGISTRY_URL)/$(DOCKER_IMAGE)
DOCKER_BASE_IMAGE_LATEST := ${DOCKER_BASE_IMAGE}:base-latest

GUNICORN_WORKERS_CNT ?= 2

BACKEND_CONTAINER_NAME := 'board-web'
NGINX_CONTAINER_NAME := 'board-nginx'
MYSQL_CONTAINER_NAME := 'board-mysql'
PROD_IP := 11.11.22.33
BACKEND_CONTAINER_ID := $(shell docker ps -aqf "name=board-web")
MYSQL_CONTAINER_ID := $(shell docker ps -aqf "name=board-mysql")


docker_build:
	docker build -t $(DOCKER_IMAGE):$(BUILD_VERSION) --target release --build-arg base_image_latest=${DOCKER_BASE_IMAGE_LATEST} .
.PHONY: docker_build

unit_tests:
	docker run --rm $(DOCKER_IMAGE):$(BUILD_VERSION) /code/manage.py test --settings=board.test_settings
.PHONY: unit_tests

docker_tag_release:
	docker tag $(DOCKER_IMAGE):$(BUILD_VERSION) $(DOCKER_RELEASE_IMAGE):$(BUILD_VERSION)
	docker tag $(DOCKER_IMAGE):$(BUILD_VERSION) $(DOCKER_RELEASE_IMAGE):latest
.PHONY: docker_tag_release

docker_pull_latest:
	docker pull $(DOCKER_RELEASE_IMAGE):latest
.PHONY: docker_pull_latest

docker_push_release:
	docker push $(DOCKER_RELEASE_IMAGE):$(BUILD_VERSION)
	docker push $(DOCKER_RELEASE_IMAGE):latest
.PHONY: docker_push_release

#####
up:
			docker-compose -f "${COMPOSE_FILENAME}" build
			docker-compose -f "${COMPOSE_FILENAME}" up

up_detached: docker_build
			docker-compose -f "${COMPOSE_FILENAME}" up -d

up_detached_ci:
			#now we use prebaked images
			docker-compose -f "${COMPOSE_FILENAME}" up -d

up_detached_on_windows: up_detached
            OWNER_GROUP_ID := $(shell getent group vboxsf | cut -d':' -f3)
			docker-compose -f "${COMPOSE_FILENAME}" exec -e OWNER_GROUP_ID="${OWNER_GROUP_ID}"  ${NGINX_CONTAINER_NAME} sh -c "groupmod -g $(OWNER_GROUP_ID) nginx && nginx -s reload"

down:
			docker-compose -f "${COMPOSE_FILENAME}" down --remove-orphans
			rm -f celerybeat.pid

docker_migrate:
			docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} python /code/manage.py migrate --noinput

docker_makemigrations:
			docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} python /code/manage.py makemigrations --noinput

locale_gen:
			python manage.py makemessages --ignore venv -a -e json,html,py

locale_compile:
			docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} python /code/manage.py compilemessages

locale_download:
			docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} python /code/manage.py download_po_files

docker_collectstatic:
			docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} python /code/manage.py collectstatic --noinput

docker_admin:
			docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} sh -c "pip install ipython && python /code/manage.py shell"

docker_mysql:
			docker exec -it "${MYSQL_CONTAINER_ID}" /usr/bin/mysql -u root --password=${MYSQL_ROOT_PASSWORD} -o board

docker_logs:
			docker logs -f "${BACKEND_CONTAINER_ID}"

docker_bash:
			 docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} sh

restart: locale_download locale_compile down up_detached docker_migrate docker_collectstatic
			echo "Started"

run:
			gunicorn -w $(GUNICORN_WORKERS_CNT) --worker-class gevent board.wsgi -b :8000 --reload

clean:
			find . -name "*.pyc" -o -name "*.pyo" -o -name __pycache__ -delete

graph_models:
			./manage.py graph_models -a -o models.png

pip:
			pip install -U pip
			pip install pip-tools

requirements: pip
			pip-compile requirements.in
			pip-sync requirements.txt

dev-requirements: pip
			pip-compile requirements.in
			pip-compile dev-requirements.in
			pip-sync dev-requirements.txt

pre: dev-requirements
			python manage.py migrate

test:
			docker-compose -f "${COMPOSE_FILENAME}" exec ${BACKEND_CONTAINER_NAME} python /code/manage.py test --settings=board.test_settings

push_docker:
			docker build -t registry.gitlab.com/kyrsantteam/board .
			docker push registry.gitlab.com/kyrsantteam/board

deploy:
			ssh backend@${PROD_IP} "cd ~/board && git pull && make restart"

deploy_hard:
			ssh backend@${PROD_IP} "cd ~/board && git pull && make down && make up_detached && make docker_migrate"


download_production_backup:
			scp backend@${PROD_IP}:/tmp/backup.sql .

restore_production_backup:
			cat backup.sql | docker exec -i "${MYSQL_CONTAINER_ID}" /usr/bin/mysql -u root --password=${MYSQL_ROOT_PASSWORD} -o board
