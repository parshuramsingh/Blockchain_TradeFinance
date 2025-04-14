const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');

async function main() {
    try {
        const cert = fs.readFileSync('/home/fabric/fabric-samples/asset-transfer-basic/my-application/wallet/appUser.crt', 'utf8');
        const key = fs.readFileSync('/home/fabric/fabric-samples/asset-transfer-basic/my-application/wallet/appUser.key', 'utf8');
        const wallet = await Wallets.newInMemoryWallet();
        await wallet.put('appUser', { credentials: { certificate: cert, privateKey: key }, mspId: 'Org1MSP', type: 'X.509' });
        console.log('Wallet loaded');

        const gateway = new Gateway();
        await gateway.connect({
            peers: { "peer0.org1.example.com": { url: "grpc://localhost:7051", tlsCACerts: { path: "/home/fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" } } }
        }, { wallet, identity: 'appUser', discovery: { enabled: false, asLocalhost: true } });
        console.log('Gateway connected');

        const network = await gateway.getNetwork('mychannel');
        console.log('Network retrieved');
        const contract = network.getContract('tradeFinance');
        console.log('Contract retrieved');

        const result = await contract.evaluateTransaction('getParticipant', 'app');
        console.log('Result:', result.toString());
        gateway.disconnect();
    } catch (error) {
        console.error('Error:', error);
        if (error.stack) console.error(error.stack);
    }
}

main();
