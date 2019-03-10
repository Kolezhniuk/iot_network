
const util = require('util');
const readline = require('readline');
const exec = util.promisify(require('child_process').exec);


const startContainer = 'docker run --name gossipv2_node_{} -d -t iot_network_memberlist'
const command = 'docker exec -d gossipv2_node_{}  ./memberlist';

const NODE_COUNT = 10;
(function main() {
  runContainers()
    .then(
      () =>
        runGossipInContainers()
          .then(
            () =>
              queryLoop()
          ));

})()


async function runContainers() {
  for (let i = 1; i <= NODE_COUNT; i++) {
    const { _, stderr } = await exec(startContainer.replace('{}', i));
    if (stderr) {
      console.error(`FAIL TO BOOTSTRAP ${i} docker containers, `, stderr);
    }

  }
  return Promise.resolve();
}

async function runGossipInContainers() {
  let comm = '';
  //run gossip in first 9 containers
  for (let i = NODE_COUNT; i >= 1; i--) {

    comm = i === 1 ? `${command.replace('{}', i)} -members="${Array.from(new Array(NODE_COUNT),
      (x, index) => "172.17.0.{}:6001".replace('{}', index + 2)).join(',')}"`: command.replace('{}', i) ;
    console.log(comm)
    const { _, stderr } = await exec(comm);

    if (stderr) {
      console.error(`FAIL TO RUN GOSSIP in ${i} docker container, `, stderr);
    }

  }

  // comm = `${command.replace('{}', 1)} -members="${Array.from(new Array(NODE_COUNT - 1),
  //   (x, index) => "172.17.0.{}:6001".replace('{}', index + 3)).join(',')}"`;
  // console.log(comm);
  // const { _, stderr } = await exec(comm);

  // if (stderr) {
  //   console.error(`FAIL TO RUN GOSSIP in 1 docker container, `, stderr);
  // }
  return Promise.resolve();
}

async function runGossipInContainersInChain() {
  let comm = '';
  //run gossip in first 9 containers
  for (let i = 1; i <= NODE_COUNT; i++) {

    comm = command.replace('{}', i).replace('{octet}', i == 10 ? 2: i + 2);
    console.log(comm)
    const { _, stderr } = await exec(comm);

    if (stderr) {
      console.error(`FAIL TO RUN GOSSIP in ${i} docker container, `, stderr);
    }

  }
  return Promise.resolve();
}

async function removeContainers() {

  const REMOVE_COMMAND = 'docker rm $(docker ps -aq)';
  const { _, stderr } = await exec(REMOVE_COMMAND);
  if (stderr) {
    console.error(`FAIL TO STOP ALL GOSSIP containers, `, stderr);
  }
  return Promise.resolve();

}

async function stopContainers() {

  const STOP_COMMAND = 'docker stop $(docker ps -aq)';
  const { _, stderr } = await exec(STOP_COMMAND);
  if (stderr) {
    console.error(`FAIL TO STOP ALL GOSSIP containers, `, stderr);
  }
  return Promise.resolve();

}

function queryLoop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  var recursiveAsyncReadLine = function () {
    rl.question('If you want stop and remove containers, please type Q', function (answer) {
      if (answer.toLowerCase() === 'q') {
        stopContainers()
          .then(() => removeContainers())
          .then(() => rl.close());
        return;
      }
      recursiveAsyncReadLine();
    });
  }
  recursiveAsyncReadLine();
}


