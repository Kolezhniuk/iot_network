# Gossip replication performance analyser

This apps helps analyze replication performance (network bnadwith, time convergence).

Testing replication between `N` goosip nodes.

## DETAILS

- Fisr must be installed `docker` and `docker-compose`
- Build image using command `docker-compose up --build` image name will be the same as folder name by default (iot_network)
- After building image you must tart couple of conteiners
- File `server/containerBootstrapper.js` used for automatic creation and creation `N` containers
- File `server/api.js` used for sending some example data to random node
- Yeah it wrriten on JavaScript :) (I .NET/JS dev so my apologize )
- Next step is use telegraf to acummulate some statistics