"use strict";

const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

// Constants
const CHANNEL_NAME = "mychannel";
const CHAINCODE_NAME = "tradeFinance";
const CONNECTION_PROFILE_PATH = path.resolve(__dirname, "connection-org1.json");
const WALLET_PATH = path.join(__dirname, "wallet");
const USER_IDENTITY = "appUser";

// Centralized network connection function with caching
let cachedGateway = null;
let cachedContract = null;

async function connectToNetwork() {
    if (cachedContract) {
        console.log("🔄 Reusing existing network connection...");
        return { gateway: cachedGateway, contract: cachedContract };
    }

    try {
        console.log("🔄 Connecting to Hyperledger Fabric network...");
        const ccp = JSON.parse(fs.readFileSync(CONNECTION_PROFILE_PATH, "utf8"));
        const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

        const identity = await wallet.get(USER_IDENTITY);
        if (!identity) {
            throw new Error(`Identity ${USER_IDENTITY} not found in wallet. Run enrollment script first.`);
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: USER_IDENTITY,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        cachedGateway = gateway;
        cachedContract = contract;
        console.log("✅ Successfully connected to network.");
        return { gateway, contract };
    } catch (error) {
        console.error("❌ Failed to connect to network:", error.message);
        throw error;
    }
}

// Cleanup function to disconnect gracefully
async function disconnect() {
    if (cachedGateway) {
        cachedGateway.disconnect();
        cachedGateway = null;
        cachedContract = null;
        console.log("🔌 Disconnected from network.");
    }
}

// ✅ Initialize Ledger
async function initLedger() {
    const { contract } = await connectToNetwork();
    try {
        console.log("🌱 Initializing Ledger...");
        await contract.submitTransaction("initLedger");
        console.log("✅ Ledger Initialized.");
    } catch (error) {
        console.error(`❌ Error initializing ledger: ${error.message}`);
        throw error;
    }
}

// ✅ Fetch a Participant
async function getParticipant(id) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`🔍 Fetching Participant with ID: ${id}`);
        const result = await contract.evaluateTransaction("getParticipant", id);
        console.log(`📄 Participant Details:\n${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error fetching participant: ${error.message}`);
        throw error;
    }
}

// ✅ Create a New Application (Process-1)
async function createApplication(applicationID, productDetails, applicantRules) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`📝 Creating Application with ID: ${applicationID}, Product: ${productDetails}, Rules: ${applicantRules}`);
        const result = await contract.submitTransaction("createApplication", applicationID, productDetails, applicantRules);
        const application = JSON.parse(result.toString());
        console.log(`✅ Application Created: ID = ${application.ID}`);
        return application;
    } catch (error) {
        console.error(`❌ Error creating application: ${error.message}`);
        throw error;
    }
}

// ✅ Fetch Application Details
async function getApplication(applicationID) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`🔍 Fetching Application with ID: ${applicationID}`);
        const result = await contract.evaluateTransaction("getApplication", applicationID);
        console.log(`📄 Application Details:\n${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error fetching application: ${error.message}`);
        throw error;
    }
}

// ✅ Fetch All Applications
async function queryAllApplications() {
    const { contract } = await connectToNetwork();
    try {
        console.log("🔍 Fetching all applications...");
        const result = await contract.evaluateTransaction("queryAllApplications");
        const applications = JSON.parse(result.toString());
        console.log("📄 All Applications:");
        console.log(JSON.stringify(applications, null, 2));
        return applications;
    } catch (error) {
        console.error(`❌ Error fetching all applications: ${error.message}`);
        throw error;
    }
}

// ✅ Approve by Issuing Bank (Process-2)
async function approveByIssuingBank(applicationID, bankID) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`📈 Issuing Bank (${bankID}) approving Application ID: ${applicationID}`);
        const result = await contract.submitTransaction("approveByIssuingBank", applicationID, bankID);
        console.log(`✅ Application Approved by Issuing Bank: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error approving application by issuing bank: ${error.message}`);
        throw error;
    }
}

// ✅ Approve by Beneficiary's Bank (Process-3)
async function approveByBeneficiaryBank(applicationID, bankID) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`📈 Beneficiary's Bank (${bankID}) approving Application ID: ${applicationID}`);
        const result = await contract.submitTransaction("approveByBeneficiaryBank", applicationID, bankID);
        console.log(`✅ Application Approved by Beneficiary's Bank: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error approving application by beneficiary's bank: ${error.message}`);
        throw error;
    }
}

// ✅ Approve and Ship by Beneficiary (Process-4)
async function approveAndShipByBeneficiary(applicationID, beneficiaryID, evidence) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`🚚 Beneficiary (${beneficiaryID}) approving and shipping for Application ID: ${applicationID}`);
        const result = await contract.submitTransaction("approveAndShipByBeneficiary", applicationID, beneficiaryID, evidence);
        console.log(`✅ Application Approved and Shipped by Beneficiary: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error approving and shipping by beneficiary: ${error.message}`);
        throw error;
    }
}

// ✅ Confirm Receipt by Applicant (Process-5)
async function confirmReceiptByApplicant(applicationID, applicantID) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`📦 Applicant (${applicantID}) confirming receipt for Application ID: ${applicationID}`);
        const result = await contract.submitTransaction("confirmReceiptByApplicant", applicationID, applicantID);
        console.log(`✅ Receipt Confirmed by Applicant: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error confirming receipt by applicant: ${error.message}`);
        throw error;
    }
}

// ✅ Prepare for Payment by Issuing Bank (Process-6)
async function prepareForPayment(applicationID, bankID) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`💰 Issuing Bank (${bankID}) preparing payment for Application ID: ${applicationID}`);
        const result = await contract.submitTransaction("prepareForPayment", applicationID, bankID);
        console.log(`✅ Application Prepared for Payment: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error preparing for payment: ${error.message}`);
        throw error;
    }
}

// ✅ Close an Application (Process-7)
async function closeApplication(applicationID, closingReason) {
    const { contract } = await connectToNetwork();
    try {
        console.log(`🚪 Closing Application ID: ${applicationID} with reason: ${closingReason}`);
        const result = await contract.submitTransaction("closeApplication", applicationID, closingReason);
        console.log(`✅ Application Closed: ${result.toString()}`);
        return result.toString();
    } catch (error) {
        console.error(`❌ Error closing application: ${error.message}`);
        throw error;
    }
}

// 🎯 CLI Argument Handling
async function main() {
    const args = process.argv.slice(2);

    try {
        if (args.length === 0) {
            console.log("\n🚀 Running default test: Fetching participant 'b1'...");
            await getParticipant("b1");
        } else {
            const command = args[0];
            switch (command) {
                case "initLedger":
                    await initLedger();
                    break;
                case "getParticipant":
                    if (!args[1]) throw new Error("Missing participant ID");
                    await getParticipant(args[1]);
                    break;
                case "createApplication":
                    if (!args[1] || !args[2] || !args[3]) throw new Error("Missing application ID, product details, or rules");
                    await createApplication(args[1], args[2], args[3]);
                    break;
                case "getApplication":
                    if (!args[1]) throw new Error("Missing application ID");
                    await getApplication(args[1]);
                    break;
                case "queryAllApplications":
                    await queryAllApplications();
                    break;
                case "approveByIssuingBank":
                    if (!args[1] || !args[2]) throw new Error("Missing application ID or bank ID");
                    await approveByIssuingBank(args[1], args[2]);
                    break;
                case "approveByBeneficiaryBank":
                    if (!args[1] || !args[2]) throw new Error("Missing application ID or bank ID");
                    await approveByBeneficiaryBank(args[1], args[2]);
                    break;
                case "approveAndShipByBeneficiary":
                    if (!args[1] || !args[2] || !args[3]) throw new Error("Missing application ID, beneficiary ID, or evidence");
                    await approveAndShipByBeneficiary(args[1], args[2], args[3]);
                    break;
                case "confirmReceiptByApplicant":
                    if (!args[1] || !args[2]) throw new Error("Missing application ID or applicant ID");
                    await confirmReceiptByApplicant(args[1], args[2]);
                    break;
                case "prepareForPayment":
                    if (!args[1] || !args[2]) throw new Error("Missing application ID or bank ID");
                    await prepareForPayment(args[1], args[2]);
                    break;
                case "closeApplication":
                    if (!args[1] || !args[2]) throw new Error("Missing application ID or closing reason");
                    await closeApplication(args[1], args[2]);
                    break;
                default:
                    console.log(`❌ Unknown command: ${command}`);
                    console.log("📝 Usage:");
                    console.log("  node myapp.js initLedger");
                    console.log("  node myapp.js getParticipant <id>");
                    console.log("  node myapp.js createApplication <appID> <productDetails> <rules>");
                    console.log("  node myapp.js getApplication <appID>");
                    console.log("  node myapp.js queryAllApplications");
                    console.log("  node myapp.js approveByIssuingBank <appID> <bankID>");
                    console.log("  node myapp.js approveByBeneficiaryBank <appID> <bankID>");
                    console.log("  node myapp.js approveAndShipByBeneficiary <appID> <beneficiaryID> <evidence>");
                    console.log("  node myapp.js confirmReceiptByApplicant <appID> <applicantID>");
                    console.log("  node myapp.js prepareForPayment <appID> <bankID>");
                    console.log("  node myapp.js closeApplication <appID> <reason>");
            }
        }
    } catch (error) {
        console.error("❌ Operation failed:", error.message);
        process.exit(1);
    } finally {
        await disconnect();
    }
}

main();
