FROM golang:1.11-alpine3.8
# image alpine
ADD gossip /gossip

WORKDIR /gossip
# install dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
RUN go get github.com/hashicorp/memberlist && go get github.com/pborman/uuid && go build
# useful commands
#docker-compose up --scale app=3
#curl -Ss -XGET "http://172.17.0.3:8080/"
#curl -Ss -XPOST "http://172.17.0.4:8080/"