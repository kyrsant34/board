ARG base_image_latest=python:3.6-alpine3.7

FROM ${base_image_latest} AS middleware
ENV PYTHONUNBUFFERED 1

FROM python:3.6-alpine3.7 AS release
ENV PYTHONUNBUFFERED 1

RUN apk update && \
    apk add --no-cache \
        gettext \
        make

#hack for pillow
ENV LIBS /usr/lib
COPY --from=middleware $LIBS/libjpeg.so* $LIBS/libpng.so* $LIBS/libffi.so* $LIBS/libmysqlclient.so* /usr/lib/
COPY --from=middleware /install /usr/local/

COPY . /code/
WORKDIR /code

ENTRYPOINT ["sh", "/code/docker-entrypoint.sh"]

EXPOSE 8000
