'use strict';

const { Wallets, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Load the network configuration
const ccpPath = path.resolve(__dirname, '..', '..', 'my-application', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function main() {
    try {
        // Create a new file system wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check if the user is enrolled
        const userExists = await wallet.get('appUser');
        if (!userExists) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run registerUser.js to enroll a user first.');
            return;
        }

        // Create a new gateway connection
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network and contract
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('tradefinance');

        // ✅ Test initializing the ledger
        console.log('\n--> Submitting Transaction: initLedger');
        await contract.submitTransaction('initLedger');
        console.log('✅ Ledger Initialized Successfully');

        // ✅ Test creating an application
        console.log('\n--> Submitting Transaction: createApplication');
        const rules = JSON.stringify(["Rule1", "Rule2"]);
        const result = await contract.submitTransaction('createApplication', '/some/directory/path', rules);
        console.log('✅ Application Created Successfully:', result.toString());

        // ✅ Test fetching application details
        console.log('\n--> Evaluating Transaction: getApplication');
        const applicationID = JSON.parse(result.toString()).ID;
        const application = await contract.evaluateTransaction('getApplication', applicationID);
        console.log('✅ Application Details:', application.toString());

        // ✅ Test closing an application
        console.log('\n--> Submitting Transaction: closeApplication');
        await contract.submitTransaction('closeApplication', '/some/directory/path', applicationID, 'Completed Successfully');
        console.log('✅ Application Closed Successfully');

        // Disconnect from the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
}

main();

