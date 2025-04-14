'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class ApproveByBeneficiaryBankWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.existingApplications = [];
        this.currentlyProcessing = new Set();
        this.maxRetries = 5;
        this.fetchRetries = 5;
        this.fetchRetryDelay = 3000;
        this.stateCheckRetries = 5;
        this.stateCheckDelay = 1000;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        this.workerIndex = workerIndex;
        this.sutAdapter = sutAdapter;
        await this.fetchExistingApplications();
        console.log(`Worker ${this.workerIndex} initialized with ${this.existingApplications.length} FORWARDED_TO_BENEFICIARY_BANK applications:`, this.existingApplications);
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
                    .filter(app =>
                        app.status === 'FORWARDED_TO_BENEFICIARY_BANK' &&
                        (!app.approvingEntities || !app.approvingEntities.includes('b2'))
                    )
                    .map(app => app.ID);
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
            console.log('No FORWARDED_TO_BENEFICIARY_BANK applications to process');
            return;
        }

        const index = Math.floor(Math.random() * this.existingApplications.length);
        const appID = this.existingApplications[index];

        if (this.currentlyProcessing.has(appID)) return;

        this.currentlyProcessing.add(appID);

        const isForwarded = await this.checkApplicationState(appID);
        if (isForwarded !== 'FORWARDED_TO_BENEFICIARY_BANK') {
            this.currentlyProcessing.delete(appID);
            this.existingApplications.splice(index, 1);
            console.log(`Skipping ${appID} - Status is ${isForwarded || 'unknown'}`);
            return;
        }

        let retry = 0;
        while (retry < this.maxRetries) {
            try {
                console.log(`Worker ${this.workerIndex} approving by beneficiary ${appID}`);
                await this.sutAdapter.sendRequests({
                    contractId: 'tradeFinance',
                    contractFunction: 'approveByBeneficiaryBank',
                    contractArguments: [appID, 'b2'],
                    readOnly: false
                });
                const newStatus = await this.checkApplicationState(appID);
                if (newStatus === 'PENDING_BENEFICIARY_APPROVAL') {
                    console.log(`✅ Verified: ${appID} status updated to PENDING_BENEFICIARY_APPROVAL`);
                    this.currentlyProcessing.delete(appID);
                    this.existingApplications.splice(index, 1);
                    return;
                } else {
                    console.error(`Verification failed: ${appID} status is ${newStatus || 'unknown'}, expected PENDING_BENEFICIARY_APPROVAL`);
                    throw new Error(`State verification failed for ${appID}`);
                }
            } catch (err) {
                console.error(`Failure for ${appID} (attempt ${retry + 1}/${this.maxRetries}): ${err.message}`);
                if (err.message.includes('MVCC') || err.message.includes('ENDORSEMENT')) {
                    retry++;
                    if (retry < this.maxRetries) {
                        console.warn(`Retrying ${appID} due to ${err.message}`);
                        await new Promise(res => setTimeout(res, 500 * (retry + 1)));
                        continue;
                    }
                }
                this.currentlyProcessing.delete(appID);
                this.existingApplications.splice(index, 1);
                return;
            }
        }
    }

    async cleanupWorkloadModule() {
        this.existingApplications = [];
        this.currentlyProcessing.clear();
    }
}

function createWorkloadModule() {
    return new ApproveByBeneficiaryBankWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
