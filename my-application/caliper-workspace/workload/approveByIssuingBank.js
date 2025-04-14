'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class ApproveByIssuingBankWorkload extends WorkloadModuleBase {
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
        console.log(`Worker ${this.workerIndex} initialized with ${this.existingApplications.length} PENDING_ISSUING_BANK applications:`, this.existingApplications);
    }

    async fetchExistingApplications() {
        let retries = 0;
        while (retries < this.fetchRetries) {
            try {
                const result = await this.sutAdapter.sendRequests({
                    contractId: 'tradeFinance',
                    contractFunction: 'queryAllApplications', // Corrected function name
                    contractArguments: [],
                    readOnly: true
                });
                const apps = JSON.parse(result.status.result.toString());
                this.existingApplications = apps
                    .filter(app => app.status === 'PENDING_ISSUING_BANK' && 
                                  (!app.approvingEntities || !app.approvingEntities.includes('b1')))
                    .map(app => app.ID);
                console.log(`🔍 Worker ${this.workerIndex} found ${this.existingApplications.length} applications in PENDING_ISSUING_BANK`);
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
                    throw err; // Re-throw to stop on failure after max retries
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
            console.log('No PENDING_ISSUING_BANK applications to process');
            return;
        }

        for (let i = 0; i < this.existingApplications.length; i++) {
            const appID = this.existingApplications[i];
            let attempt = 0;

            if (this.currentlyProcessing.has(appID)) continue;

            this.currentlyProcessing.add(appID);

            const isPending = await this.checkApplicationState(appID);
            if (isPending !== 'PENDING_ISSUING_BANK') {
                this.currentlyProcessing.delete(appID);
                this.existingApplications.splice(i, 1);
                console.log(`⚠️ Worker ${this.workerIndex} skipped ${appID} - Status is ${isPending || 'unknown'}`);
                continue;
            }

            let retry = 0;
            while (retry < this.maxRetries && attempt < this.maxAttemptsPerApp) {
                try {
                    console.log(`Worker ${this.workerIndex} approving ${appID} (Attempt ${attempt + 1})`);
                    await this.sutAdapter.sendRequests({
                        contractId: 'tradeFinance',
                        contractFunction: 'approveByIssuingBank',
                        contractArguments: [appID, 'b1'],
                        readOnly: false
                    });
                    const newStatus = await this.checkApplicationState(appID);
                    if (newStatus === 'FORWARDED_TO_BENEFICIARY_BANK') {
                        console.log(`✅ Worker ${this.workerIndex} verified: ${appID} status updated to FORWARDED_TO_BENEFICIARY_BANK`);
                        this.currentlyProcessing.delete(appID);
                        this.existingApplications.splice(i, 1);
                        break;
                    } else {
                        console.error(`Verification failed: ${appID} status is ${newStatus || 'unknown'}, expected FORWARDED_TO_BENEFICIARY_BANK`);
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
                        i--; // Retry the same app in the next iteration
                    } else {
                        console.error(`Max attempts reached for ${appID}, marking as unfinished`);
                    }
                    break;
                }
            }
        }
        console.log(`✅ Worker ${this.workerIndex} forwarded ${this.existingApplications.length} applications: ${this.existingApplications}`);
    }

    async cleanupWorkloadModule() {
        this.existingApplications = [];
        this.currentlyProcessing.clear();
    }
}

function createWorkloadModule() {
    return new ApproveByIssuingBankWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
