'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class CloseApplicationWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.existingApplications = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.sutAdapter = sutAdapter;
        this.workerIndex = workerIndex;

        // Fetch existing application IDs
        if (roundIndex === 7) { // close-application is the eighth round (index 7)
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
            if (result.status && result.status.result) {
                const applications = JSON.parse(result.status.result.toString());
                this.existingApplications = applications.map(app => app.ID);
            } else {
                throw new Error('queryAllApplications returned no result');
            }
        } catch (error) {
            console.error('Failed to fetch existing applications using queryAllApplications:', error.message);
            throw error;
        }

        if (this.existingApplications.length === 0) {
            console.warn('No existing applications found, this may cause the closeApplication round to fail');
        }
    }

    async submitTransaction() {
        if (this.existingApplications.length === 0) {
            throw new Error('No existing applications found to close');
        }

        // Randomly select an application ID to close
        const applicationID = this.existingApplications[Math.floor(Math.random() * this.existingApplications.length)];
        const closingReason = 'Transaction Complete'; // Hardcoded closing reason (same as in myapp.js)

        const args = {
            contractId: 'tradeFinance',
            contractFunction: 'closeApplication',
            contractArguments: [applicationID, closingReason],
            readOnly: false
        };

        console.log('Closing application ID:', applicationID);
        try {
            const result = await this.sutAdapter.sendRequests(args);
            console.log('closeApplication succeeded for ID:', applicationID, 'result:', result);
        } catch (error) {
            console.error('closeApplication failed for ID:', applicationID, 'error:', error.message, 'details:', error);
            throw error;
        }
    }
}

function createWorkloadModule() {
    return new CloseApplicationWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
