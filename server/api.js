const axios = require('axios');

const NODE_COUNT = 3;
const IP_MASK = '172.17.0.{}';
const PORT = 8080;

let POST_TEMPLATE = {
    node_id: 0,
    message_id: "message_uuid_here ---> {}",
    message: "SAMPLE_MESSAGE"
};

(function main() {
    setInterval(() => postData(), 10000)


})();


function postData() {

    const address = getRandomIP().address;
    const node = getRandomIP().node_number;
    let postedData = Object.assign({}, POST_TEMPLATE);
    postedData.node_id = node;
    postedData.message_id = postedData.message_id.replace('{}', new Date().toISOString())
    axios.post(address, postedData)
        .then((res) => {
            console.info(`MESSAGE: ${postedData} POSTED, , details: ${res}`)
        })
        .catch((error) => {
            console.info(`ERROR DURING POSTING: ${postedData}, details: ${error}`)
        });

}


function getRandomIP() {
    //1st container starts from ip 172.17.0.2
    const MIN = 2;
    const MAX = MIN + NODE_COUNT;
    const LAST_OCTET = Math.floor(Math.random() * (+MAX - +MIN)) + +MIN;
    return { address: `http://${IP_MASK.replace('{}', LAST_OCTET)}:${PORT}`, node_number: LAST_OCTET };
}
