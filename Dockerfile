FROM golang:1.11-alpine3.8

ADD memberlist /memberlist

WORKDIR /memberlist

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh 
    # gcc
# RUN go get github.com/derekparker/delve/cmd/dlv
RUN go get github.com/hashicorp/memberlist && go get github.com/pborman/uuid && go build
# RUN dlv debug . -l 0.0.0.0:2345 --headless=true --log=true -- server