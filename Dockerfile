FROM golang:1.11-alpine3.8

ADD gossip /gossip

WORKDIR /gossip

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

RUN go get github.com/weaveworks/mesh && go build

#docker-compose up --scale app=3

#docker exec -d gossip_host1  ./gossip -mesh :6001 -http :8080
#docker exec -d gossip_host2  ./gossip -mesh :6001 -http :8080 -peer 172.17.0.2:6001
#docker exec -d gossip_host3  ./gossip -mesh :6001 -http :8080 -peer 172.17.0.2:6001

#curl -Ss -XGET "http://172.17.0.3:8080/"
#curl -Ss -XPOST "http://172.17.0.4:8080/"

