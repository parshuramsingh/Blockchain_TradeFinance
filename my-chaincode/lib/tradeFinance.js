"use strict";

const { Contract } = require('fabric-contract-api');

class TradeFinanceContract extends Contract {
    async initLedger(ctx) {
        console.info('Initializing Ledger: TradeFinanceContract');
        await this.createDemoParticipants(ctx);
    }

    async createDemoParticipants(ctx) {
        const participants = [
            { id: 'b1', name: 'Bank b1', type: 'Bank' },
            { id: 'b2', name: 'Bank b2', type: 'Bank' },
            { id: 'e1', name: 'BankEmployee e1', type: 'Employee', bankId: 'b1' },
            { id: 'e2', name: 'BankEmployee e2', type: 'Employee', bankId: 'b2' },
            { id: 'app', name: 'Applicant app', type: 'User' },
            { id: 'ben', name: 'Beneficiary ben', type: 'User' }
        ];

        for (const participant of participants) {
            await ctx.stub.putState(participant.id, Buffer.from(JSON.stringify(participant)));
        }
    }

    async getParticipant(ctx, id) {
        const participantAsBytes = await ctx.stub.getState(id);
        if (!participantAsBytes || participantAsBytes.length === 0) {
            throw new Error(`Participant with ID ${id} does not exist`);
        }
        return participantAsBytes.toString();
    }
    
    // get all Applications 
async queryAllApplications(ctx) {
    const startKey = '';
    const endKey = '';
    const applications = [];

    const iterator = await ctx.stub.getStateByRange(startKey, endKey);

    try {
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                const strValue = res.value.value.toString('utf8');

                try {
                    const record = JSON.parse(strValue);
                    if (record.ID && record.ID.startsWith('app_')) {
                        applications.push(record);
                    }
                } catch (err) {
                    console.error(`Error parsing record: ${err.message}`);
                }
            }
            res = await iterator.next();
        }
    } catch (err) {
        console.error(`Error iterating over applications: ${err.message}`);
    } finally {
        await iterator.close();
    }

    return JSON.stringify(applications);
}


    // Process-1: Applicant creates initial request
    async createApplication(ctx, applicationID, productDetails, applicantRules) {
        const finalApplicationID = applicationID || ctx.stub.getTxID();
        const applicationAsset = {
            ID: finalApplicationID,
            applicant: 'app',
            beneficiary: 'ben',
            issuingBank: 'b1',
            exportingBank: 'b2',
            productDetails,
            rules: applicantRules,
            evidence: null,
            approvingEntities: [],
            status: 'PENDING_ISSUING_BANK',
            statusHistory: [{ status: 'PENDING_ISSUING_BANK', timestamp: ctx.stub.getTxTimestamp() }]
        };

        await ctx.stub.putState(finalApplicationID, Buffer.from(JSON.stringify(applicationAsset)));
        return JSON.stringify(applicationAsset);
    }

    // Process-2: Applicant's bank analysis and forwarding
    async approveByIssuingBank(ctx, applicationID, bankID) {
        const applicationBytes = await ctx.stub.getState(applicationID);
        if (!applicationBytes || applicationBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        const application = JSON.parse(applicationBytes.toString());

        // Only issuing bank (b1) can approve
        if (bankID !== application.issuingBank) {
            throw new Error("Only issuing bank can approve the application.");
        }

        // Check current status
        if (application.status !== 'PENDING_ISSUING_BANK') {
            throw new Error("Application is not in PENDING_ISSUING_BANK state");
        }

        application.status = "FORWARDED_TO_BENEFICIARY_BANK";
        application.approvingEntities.push(bankID);
        application.statusHistory.push({ 
            status: application.status, 
            timestamp: ctx.stub.getTxTimestamp() 
        });

        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        return JSON.stringify(application);
    }

    // Process-3: Beneficiary's bank confirmation
    async approveByBeneficiaryBank(ctx, applicationID, bankID) {
        const applicationBytes = await ctx.stub.getState(applicationID);
        if (!applicationBytes || applicationBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        const application = JSON.parse(applicationBytes.toString());

        // Only exporting bank (b2) can approve
        if (bankID !== application.exportingBank) {
            throw new Error("Only beneficiary's bank can approve the application.");
        }

        // Check current status
        if (application.status !== 'FORWARDED_TO_BENEFICIARY_BANK') {
            throw new Error("Application is not in FORWARDED_TO_BENEFICIARY_BANK state");
        }

        application.status = "PENDING_BENEFICIARY_APPROVAL";
        application.approvingEntities.push(bankID);
        application.statusHistory.push({ 
            status: application.status, 
            timestamp: ctx.stub.getTxTimestamp() 
        });

        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        return JSON.stringify(application);
    }

    // Process-4: Beneficiary approval and shipping
    async approveAndShipByBeneficiary(ctx, applicationID, beneficiaryID, evidence) {
        const applicationBytes = await ctx.stub.getState(applicationID);
        if (!applicationBytes || applicationBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        const application = JSON.parse(applicationBytes.toString());

        // Only beneficiary (ben) can approve
        if (beneficiaryID !== application.beneficiary) {
            throw new Error("Only beneficiary can approve and ship the product.");
        }

        // Check current status
        if (application.status !== 'PENDING_BENEFICIARY_APPROVAL') {
            throw new Error("Application is not in PENDING_BENEFICIARY_APPROVAL state");
        }

        application.status = "SHIPPED";
        application.evidence = evidence;
        application.approvingEntities.push(beneficiaryID);
        application.statusHistory.push({ 
            status: application.status, 
            timestamp: ctx.stub.getTxTimestamp() 
        });

        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        return JSON.stringify(application);
    }

    // Process-5: Applicant confirms receipt
    async confirmReceiptByApplicant(ctx, applicationID, applicantID) {
        const applicationBytes = await ctx.stub.getState(applicationID);
        if (!applicationBytes || applicationBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        const application = JSON.parse(applicationBytes.toString());

        // Only applicant (app) can confirm receipt
        if (applicantID !== application.applicant) {
            throw new Error("Only applicant can confirm receipt of the product.");
        }

        // Check current status
        if (application.status !== 'SHIPPED') {
            throw new Error("Application is not in SHIPPED state");
        }

        application.status = "RECEIVED";
        application.approvingEntities.push(applicantID);
        application.statusHistory.push({ 
            status: application.status, 
            timestamp: ctx.stub.getTxTimestamp() 
        });

        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        return JSON.stringify(application);
    }

    // Process-6: Applicant's bank updates to READY_FOR_PAYMENT
    async prepareForPayment(ctx, applicationID, bankID) {
        const applicationBytes = await ctx.stub.getState(applicationID);
        if (!applicationBytes || applicationBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        const application = JSON.parse(applicationBytes.toString());

        // Only issuing bank (b1) can update to READY_FOR_PAYMENT
        if (bankID !== application.issuingBank) {
            throw new Error("Only issuing bank can prepare for payment.");
        }

        // Check current status
        if (application.status !== 'RECEIVED') {
            throw new Error("Application is not in RECEIVED state");
        }

        application.status = "READY_FOR_PAYMENT";
        application.approvingEntities.push(bankID);
        application.statusHistory.push({ 
            status: application.status, 
            timestamp: ctx.stub.getTxTimestamp() 
        });

        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        return JSON.stringify(application);
    }

    // Process-7: Beneficiary's bank closes transaction
    async closeApplication(ctx, applicationID, closingReason) {
        const application = await this._getApplication(ctx, applicationID);
        
        if (!['READY_FOR_PAYMENT', 'PAID'].includes(application.status)) {
            throw new Error('Application must be READY_FOR_PAYMENT or PAID to close');
        }

        application.status = 'CLOSED';
        application.closeReason = closingReason;
        application.statusHistory.push({ 
            status: 'CLOSED', 
            timestamp: ctx.stub.getTxTimestamp() 
        });

        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        return JSON.stringify(application);
    }

    // Helper function to get application
    async _getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }
        return JSON.parse(applicationAsBytes.toString());
    }

    async getApplication(ctx, applicationID) {
        return JSON.stringify(await this._getApplication(ctx, applicationID));
    }
}


module.exports = TradeFinanceContract;
