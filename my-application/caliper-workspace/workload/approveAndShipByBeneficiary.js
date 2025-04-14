'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class ApproveAndShipByBeneficiaryWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.existingApplications = [];
        this.currentlyProcessing = new Set();
        this.maxRetries = 12;
        this.fetchRetries = 5;
        this.fetchRetryDelay = 3000;
        this.stateCheckRetries = 5;
        this.stateCheckDelay = 1000;
        this.maxAttemptsPerApp = 3;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        this.workerIndex = workerIndex;
        this.sutAdapter = sutAdapter;
        await this.fetchExistingApplications();
        console.log(`Worker ${this.workerIndex} initialized with ${this.existingApplications.length} PENDING_BENEFICIARY_APPROVAL applications:`, this.existingApplications);
    }

    async fetchExistingApplications() {
        let retries = 0;
        while (retries < this.fetchRetries) {
            try {
                const result = await this.sutAdapter.sendRequests({
                    contractId: 'tradeFinance',
                    contractFunction: 'queryAllApplications',
                    contractArguments: [],
                    readOnly: true
                });
                const apps = JSON.parse(result.status.result.toString());
                this.existingApplications = apps
                    .filter(app => app.status === 'PENDING_BENEFICIARY_APPROVAL' &&
                        (!app.approvingEntities || !app.approvingEntities.includes('b2')))
                    .map(app => app.ID);
                console.log(`🔍 Worker ${this.workerIndex} found ${this.existingApplications.length} applications in PENDING_BENEFICIARY_APPROVAL`);
                if (this.existingApplications.length > 0) break;
                retries++;
                if (retries < this.fetchRetries) {
                    console.warn(`Fetch retry ${retries + 1}/${this.fetchRetries}...`);
                    await new Promise(res => setTimeout(res, this.fetchRetryDelay));
                }
            } catch (err) {
                console.error(`Fetch attempt ${retries + 1} failed: ${err.message}`);
                retries++;
                if (retries < this.fetchRetries) {
                    await new Promise(res => setTimeout(res, this.fetchRetryDelay));
                } else {
                    throw err;
                }
            }
        }
    }

    async checkApplicationState(applicationId) {
        let retries = 0;
        while (retries < this.stateCheckRetries) {
            try {
                const result = await this.sutAdapter.sendRequests({
                    contractId: 'tradeFinance',
                    contractFunction: 'getApplication',
                    contractArguments: [applicationId],
                    readOnly: true
                });
                const app = JSON.parse(result.status.result.toString());
                return app.status;
            } catch (err) {
                console.warn(`State check retry ${retries + 1}/${this.stateCheckRetries} for ${applicationId} failed: ${err.message}`);
                retries++;
                if (retries < this.stateCheckRetries) {
                    await new Promise(res => setTimeout(res, this.stateCheckDelay));
                } else {
                    return null;
                }
            }
        }
    }

    async submitTransaction() {
        if (this.existingApplications.length === 0) {
            console.log('No PENDING_BENEFICIARY_APPROVAL applications to process');
            return;
        }

        let processedCount = 0;
        for (let i = 0; i < this.existingApplications.length; i++) {
            const appID = this.existingApplications[i];
            let attempt = 0;

            if (this.currentlyProcessing.has(appID)) continue;

            this.currentlyProcessing.add(appID);

            const currentState = await this.checkApplicationState(appID);
            if (currentState !== 'PENDING_BENEFICIARY_APPROVAL') {
                this.currentlyProcessing.delete(appID);
                this.existingApplications.splice(i, 1);
                console.log(`⚠️ Worker ${this.workerIndex} skipped ${appID} - Status is ${currentState || 'unknown'}`);
                continue;
            }

            let retry = 0;
            while (retry < this.maxRetries && attempt < this.maxAttemptsPerApp) {
                try {
                    console.log(`Worker ${this.workerIndex} approving and shipping ${appID} (Attempt ${attempt + 1})`);
                    const submitResult = await this.sutAdapter.sendRequests({
                        contractId: 'tradeFinance',
                        contractFunction: 'approveAndShipByBeneficiary',
                        contractArguments: [appID, 'b2'],
                        readOnly: false
                    });

                    // Check the response from the transaction submission
                    if (submitResult.status.code !== 200) {
                        console.error(`Transaction failed for ${appID} with error code: ${submitResult.status.code}`);
                        throw new Error(`Transaction failed for ${appID}`);
                    }

                    // Introduce a delay to ensure the transaction is committed
                    await new Promise(res => setTimeout(res, 5000)); // 5 seconds delay

                    // After the delay, recheck the state to ensure the transition is complete
                    const newStatus = await this.checkApplicationState(appID);
                    if (newStatus === 'SHIPPED') {
                        console.log(`✅ Worker ${this.workerIndex} verified: ${appID} status updated to SHIPPED`);
                        this.currentlyProcessing.delete(appID);
                        this.existingApplications.splice(i, 1);
                        processedCount++;
                        break;
                    } else {
                        console.error(`Verification failed: ${appID} status is ${newStatus || 'unknown'}, expected SHIPPED`);
                        throw new Error(`State verification failed for ${appID}`);
                    }
                } catch (err) {
                    console.error(`Failure for ${appID} (Retry ${retry + 1}/${this.maxRetries}): ${err.message}`);
                    if (err.message.includes('MVCC') || err.message.includes('ENDORSEMENT')) {
                        retry++;
                        if (retry < this.maxRetries) {
                            console.warn(`Retrying ${appID} due to ${err.message}`);
                            await new Promise(res => setTimeout(res, 2000 * retry));
                            continue;
                        }
                    }
                    attempt++;
                    if (attempt < this.maxAttemptsPerApp) {
                        console.warn(`New attempt ${attempt + 1}/${this.maxAttemptsPerApp} for ${appID}`);
                        await new Promise(res => setTimeout(res, 5000));
                        i--; // Retry same app
                    } else {
                        console.error(`Max attempts reached for ${appID}, marking as unfinished`);
                    }
                    break;
                }
            }
        }
        console.log(`✅ Worker ${this.workerIndex} completed approve-and-ship: processed ${processedCount} applications.`);
    }

    async cleanupWorkloadModule() {
        this.existingApplications = [];
        this.currentlyProcessing.clear();
    }
}

function createWorkloadModule() {
    return new ApproveAndShipByBeneficiaryWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;

