# Gossip replication performance analyser

This apps helps analyze replication performance (network bandwidth, time convergence).

Testing replication between `N` gossip nodes.

## DETAILS

- First must be installed `docker` and `docker-compose`
- Build image using command `docker-compose up --build` image name will be the same as folder name by default (iot_network)
- After building image you must tart couple of containers
- File `server/v2/containerBootstrapper.js` used for automatic creation and creation `N` containers
- File `server/v2/api.js` used for sending some example data to random node
- Yeah it written on JavaScript :) (I .NET/JS dev so my apologize )
- Next step is use telegraf to accumulate some statistics
- Generate telegraf config 
```
telegraf --input-filter net:docker --output-filter influx config > docker_net_telegraf.conf
```