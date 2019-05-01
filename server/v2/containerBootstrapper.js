
const util = require('util');
const readline = require('readline');
const exec = util.promisify(require('child_process').exec);


const startContainer = 'docker run --name gossip_node_{} -d -t gossip';
const command = 'docker exec -d gossip_node_{} sh -c "./gossip ';

const NODE_COUNT = 16;
(function main() {
  runContainers()
    .then(
      () =>
        runGossipInContainers()
          .then(
            () =>
              queryLoop()
          ));

})();


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

    comm = i === 1 ? `${command.replace('{}', i)} -members='${Array.from(new Array(NODE_COUNT),
      (x, index) => '172.17.0.{}:6001'.replace('{}', index + 2)).join(',')}' > log.txt"` : `${command.replace('{}', i)} > log.txt"`;
    console.log(comm)
    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    });
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
  let recursiveAsyncReadLine =  () => {
    rl.question('If you want stop and remove containers, please type Q',  (answer) => {
      if (answer.toLowerCase() === 'q') {
        stopContainers()
          .then(() => removeContainers())
          .then(() => rl.close());
        return;
      }
      recursiveAsyncReadLine();
    });
  };
  recursiveAsyncReadLine();
}


