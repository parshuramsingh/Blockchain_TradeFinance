"use strict";

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class PrepareForPaymentWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.existingApplications = [];
        this.processedApplications = new Set();
        this.batchSize = 10;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.sutAdapter = sutAdapter;
        this.workerIndex = workerIndex;

        if (roundIndex === 6) { // Ensure it's the seventh round
            await this.fetchExistingApplications();
        }
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
                this.existingApplications = applications
                    .filter(app => app.status === 'RECEIVED' && !this.processedApplications.has(app.ID))
                    .slice(0, this.batchSize)
                    .map(app => app.ID);
            }
        } catch (error) {
            console.error(`Worker ${this.workerIndex} failed to fetch applications:`, error.message);
        }
    }

    async submitTransaction() {
        if (this.existingApplications.length === 0) {
            await this.fetchExistingApplications();
            if (this.existingApplications.length === 0) return;
        }

        const applicationID = this.existingApplications.pop();
        const bankID = 'b1'; // Issuing bank ID

        const args = {
            contractId: 'tradeFinance',
            contractFunction: 'prepareForPayment',
            contractArguments: [applicationID, bankID],
            readOnly: false
        };

        try {
            const result = await this.sutAdapter.sendRequests(args);
            console.log(`Worker ${this.workerIndex} prepared for payment for application ID: ${applicationID}`, result);
            this.processedApplications.add(applicationID);
        } catch (error) {
            console.error(`Worker ${this.workerIndex} failed to prepare for payment for application ID: ${applicationID}`, error.message);
        }
    }
}

function createWorkloadModule() {
    return new PrepareForPaymentWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;

