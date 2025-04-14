'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class CreateApplicationWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.productCategories = [
            'Electronics', 'Clothing', 'Machinery', 'Furniture', 'Automotive Parts',
            'Textiles', 'Chemicals', 'Agricultural Goods', 'Medical Supplies', 'Consumer Goods'
        ];
        this.rulesOptions = [
            'Payment within 30 days', 'Payment on delivery', 'Payment within 60 days',
            'Advance payment required', 'Payment after inspection'
        ];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.sutAdapter = sutAdapter;
        this.workerIndex = workerIndex;
        console.log(`Worker ${workerIndex} initialized.`);
    }

    async submitTransaction() {
        this.txIndex++;
        const applicationID = `app_${this.workerIndex}_${this.txIndex}`;
        const productCategory = this.productCategories[Math.floor(Math.random() * this.productCategories.length)];
        const quantity = Math.floor(Math.random() * 100) + 1;
        const productDetails = `${quantity} Units of ${productCategory}`;
        const rules = this.rulesOptions[Math.floor(Math.random() * this.rulesOptions.length)];

        const args = {
            contractId: 'tradeFinance',
            contractFunction: 'createApplication',
            contractArguments: [applicationID, productDetails, rules],
            readOnly: false
        };

        console.log(`Submitting createApplication: ID=${applicationID}, Product=${productDetails}, Rules=${rules}`);
        try {
            const result = await this.sutAdapter.sendRequests(args);
            console.log(`createApplication success: ID=${applicationID}, Result=${result}`);
        } catch (error) {
            console.error(`createApplication failed: ID=${applicationID}, Error=${error.message}`);
            throw error;
        }
    }
}

function createWorkloadModule() {
    return new CreateApplicationWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;

