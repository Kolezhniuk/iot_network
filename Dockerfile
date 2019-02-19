FROM golang:1.11-alpine3.8

RUN echo 'hosts: files dns' >> /etc/nsswitch.conf
RUN apk add --no-cache tzdata bash ca-certificates && \
    update-ca-certificates

ENV INFLUXDB_VERSION 1.5.4
RUN set -ex && \
    apk add --no-cache --virtual .build-deps wget gnupg tar && \
    for key in \
        05CE15085FC09D18E99EFB22684A14CF2582E0C5 ; \
    do \
        gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" || \
        gpg --keyserver pgp.mit.edu --recv-keys "$key" || \
        gpg --keyserver keyserver.pgp.com --recv-keys "$key" ; \
    done && \
    wget --no-verbose https://dl.influxdata.com/influxdb/releases/influxdb-${INFLUXDB_VERSION}-static_linux_amd64.tar.gz.asc && \
    wget --no-verbose https://dl.influxdata.com/influxdb/releases/influxdb-${INFLUXDB_VERSION}-static_linux_amd64.tar.gz && \
    gpg --batch --verify influxdb-${INFLUXDB_VERSION}-static_linux_amd64.tar.gz.asc influxdb-${INFLUXDB_VERSION}-static_linux_amd64.tar.gz && \
    mkdir -p /usr/src && \
    tar -C /usr/src -xzf influxdb-${INFLUXDB_VERSION}-static_linux_amd64.tar.gz && \
    rm -f /usr/src/influxdb-*/influxdb.conf && \
    chmod +x /usr/src/influxdb-*/* && \
    cp -a /usr/src/influxdb-*/* /usr/bin/ && \
    rm -rf *.tar.gz* /usr/src /root/.gnupg && \
    apk del .build-deps
COPY influxdb.conf /etc/influxdb/influxdb.conf

EXPOSE 8086

VOLUME /var/lib/influxdb

COPY entrypoint.sh /entrypoint.sh
COPY init-influxdb.sh /init-influxdb.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["influxd"]




ADD gossip /gossip

WORKDIR /gossip

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

RUN go get github.com/weaveworks/mesh && go build

#docker exec -d gossip_host1  ./gossip -hwaddr 02:42:ac:11:00:02 -nickname g1 -mesh :6001 -http :8080
#docker exec -d gossip_host2  ./gossip -hwaddr 02:42:ac:11:00:03 -nickname g2 -mesh :6001 -http :8080 -peer 172.17.0.2:6001
#docker exec -d gossip_host3  ./gossip -hwaddr 02:42:ac:11:00:04 -nickname g3 -mesh :6001 -http :8080 -peer 172.17.0.2:6001

#curl -Ss -XGET "http://172.17.0.3:8080/"
#curl -Ss -XPOST "http://172.17.0.4:8080/"

