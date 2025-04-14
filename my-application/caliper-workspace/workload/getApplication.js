'use strict';
const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class GetApplicationWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.existingApplications = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.sutAdapter = sutAdapter;
        this.workerIndex = workerIndex;

        // Query the ledger to get existing application IDs
        if (roundIndex === 1) { // get-application is the second round (index 1)
            await this.fetchExistingApplications();
        }
        console.log('Worker', workerIndex, 'found existing applications:', this.existingApplications);
    }

    async fetchExistingApplications() {
        const args = {
            contractId: 'tradeFinance',
            contractFunction: 'queryAllApplications',
            contractArguments: [],
            readOnly: true
        };
        try {
            const result = await this.sutAdapter.sendRequests(args);
            const applications = JSON.parse(result.status.result.toString());
            this.existingApplications = applications.map(app => app.ID);
        } catch (error) {
            console.error('Failed to fetch existing applications:', error.message);
            throw error;
        }
    }

    async submitTransaction() {
        if (this.existingApplications.length === 0) {
            throw new Error('No existing applications found to query');
        }

        // Randomly select an application ID to query
        const applicationID = this.existingApplications[Math.floor(Math.random() * this.existingApplications.length)];

        const args = {
            contractId: 'tradeFinance',
            contractFunction: 'getApplication',
            contractArguments: [applicationID],
            readOnly: true
        };
        console.log('Querying getApplication with ID:', applicationID);
        try {
            const result = await this.sutAdapter.sendRequests(args);
            console.log('getApplication succeeded for ID:', applicationID, 'result:', result);
        } catch (error) {
            console.error('getApplication failed for ID:', applicationID, 'error:', error.message, 'details:', error);
            throw error;
        }
    }
}

function createWorkloadModule() {
    return new GetApplicationWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
