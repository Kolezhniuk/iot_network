const axios = require('axios');

const NODE_COUNT = 16; // Count of containers
const IP_MASK = '172.17.0.{}';  /* Default IP address for docker containers */
const PORT = 8080;

let POST_TEMPLATE = { "test": Math.random() * 10 };

(function main() {
    postData();
    // If you need post data with interval.
    // setInterval(() =>
    // postData();
    // postSample();
    //  , 60000);
    setInterval(() => pingAlive(), 10000);
    // pingAlive(5000);
})();


function postData() {

    const address = getRandomIP().address;
    axios.post(address, POST_TEMPLATE)
        .then((res) => {
            console.log(`MESSAGE: TO ${address} POSTED, , details: ${res}`)
        })
        .catch((error) => {
            console.log(`ERROR DURING POST details: ${error}`)
        });

}

function getData() {

    const address = getRandomIP().address;
    axios.get(address)
        .then((res) => {
            console.log(`MESSAGE: to ADDRESS  ${address} GET,  details: ${res.data}`)
        })
        .catch((error) => {
            console.log(`ERROR DURING GETTING to ADDRESS: ${address}, details: ${error}`)
        });

}


function getRandomIP() {
    //1st container starts from ip 172.17.0.2
    const MIN = 2;
    const MAX = MIN + NODE_COUNT;
    const LAST_OCTET = Math.floor(Math.random() * (+MAX - +MIN)) + +MIN;
    return { address: `http://${IP_MASK.replace('{}', LAST_OCTET)}:${PORT}`, node_number: LAST_OCTET };
}



async function pingAlive() {
    for (let i = 2; i <= NODE_COUNT + 1; i++) {
        const address = `http://${IP_MASK.replace('{}', i)}:${PORT}`;
        try {
            const response = await axios.get(address);
            console.log(`GET to ${address} success with data`);
            console.log(response.data);

        } catch (error) {
            console.log(`ERROR GET to ${address}`);
        }

    }

}