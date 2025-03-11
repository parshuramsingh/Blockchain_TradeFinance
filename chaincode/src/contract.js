"use strict";

const { Contract } = require('fabric-contract-api');

class CreateDemoParticipants extends Contract {

    async initLedger(ctx) {
        console.info('Initializing Ledger: CreateDemoParticipants');
        await this.createDemoParticipants(ctx);
    }

    // Method to create demo participants (two banks, two employees, one applicant, one beneficiary)
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
            console.info('Participant ${participant.name} created');
        }

        console.info('Demo participants created successfully.');
    }

    // Helper function to get participant details
    async getParticipant(ctx, id) {
        const participantAsBytes = await ctx.stub.getState(id);
        if (!participantAsBytes || participantAsBytes.length === 0) {
            throw new Error('${id} does not exist');
        }
        return participantAsBytes.toString();
    }
}



// Algorithm 2




class InitialPhaseOfApplication extends Contract {

    // Function to create an application asset
    async createApplication(ctx, directoryPath, applicantRules) {
        console.info('Creating a new application asset...');

        // Example values based on the given algorithm
        const applicationID = 'app-ref-100';    // Application reference number
        const applicant = 'app';                // Applicant is 'app'
        const beneficiary = 'ben';              // Beneficiary is 'ben'
        const issuingBank = 'b1';               // Issuing bank is 'b1'
        const exportingBank = 'b2';             // Exporting bank is 'b2'
        const rules = applicantRules;           // Rules provided by the applicant
        const productDetails = 'pd1';           // Product details for the application
        const evidence = null;                  // Initially, there is no evidence attached
        const approvingEntities = ['app'];      // The applicant is the approving entity for now
        const status = 'AWAITING_APPROVAL';     // Status of the application asset

        // Constructing the application asset object
        const applicationAsset = {
            ID: applicationID,
            applicant: applicant,
            beneficiary: beneficiary,
            issuingBank: issuingBank,
            exportingBank: exportingBank,
            rules: rules,
            productDetails: productDetails,
            evidence: evidence,
            approvingEntities: approvingEntities,
            status: status
        };

        // Storing the application asset on the blockchain ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(applicationAsset)));
        console.info('Application asset with ID ${applicationID} created successfully.');

        return JSON.stringify(applicationAsset);
    }

    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error('Application with ID ${applicationID} does not exist');
        }
        return applicationAsBytes.toString();
    }
}





// Algorithm 3 





class SuggestChanges extends Contract {

    // Function to suggest changes to an application
    async suggestChanges(ctx, directoryPath, applicationID, newRules, suggestingEntity) {
        console.info('Suggesting changes to application ${applicationID}...');

        // Fetch the application asset from the ledger using the application ID
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error('Application with ID ${applicationID} does not exist');
        }

        // Parse the application data
        const application = JSON.parse(applicationAsBytes.toString());

        // Check application status based on the given conditions
        const closedStatuses = ['CLOSED', 'REJECTED'];
        const finalStatuses = ['APPROVED'];
        const shippingStatuses = ['SHIPPED', 'RECEIVED', 'READY_FOR_PAYMENT'];

        // Check if the application is in a state where it cannot be updated
        if (closedStatuses.includes(application.status)) {
            throw new Error('Error: Application is closed previously.');
        } else if (finalStatuses.includes(application.status)) {
            throw new Error('Error: Application is approved previously.');
        } else if (shippingStatuses.includes(application.status)) {
            throw new Error('Error: Product is shipped already.');
        }

        // Update the application with the new rules and approving entity
        application.rules.push(newRules);  // Append new rules to the existing ones
        application.approvingEntities = suggestingEntity;  // Update the approving entity
        application.status = 'AWAITING_APPROVAL';  // Set status to "AWAITING_APPROVAL"

        // Store the updated application back into the ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        console.info('Application ${applicationID} updated successfully with new rules from ${suggestingEntity}.');

        return JSON.stringify(application);
    }

    // Function to load participants’ data (mock function for demonstration)
    async loadParticipantsData(ctx, directoryPath) {
        console.info('Loading participants data from directory: ${directoryPath}');

        // In a real implementation, you would load actual data from the directory.
        // For this example, we assume the participants are predefined.
        const applicant = 'app';            // Applicant entity
        const beneficiary = 'ben';          // Beneficiary entity
        const issuingBank = 'b1';           // Issuing Bank entity
        const exportingBank = 'b2';         // Exporting Bank entity

        return { applicant, beneficiary, issuingBank, exportingBank };
    }

    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error('Application with ID ${applicationID} does not exist');
        }
        return applicationAsBytes.toString();
    }
}





// Algorithm 4 





class RejectApplication extends Contract {

    // Function to reject an application and mark it as "REJECTED"
    async rejectApplication(ctx, directoryPath, applicationID, reason, rejectingEntity) {
        console.info('Rejecting application ${applicationID}...');

        // Fetch the application asset from the ledger using the application ID
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error('Application with ID ${applicationID} does not exist');
        }

        // Parse the application data
        const application = JSON.parse(applicationAsBytes.toString());

        // Check if the application is already closed or rejected
        if (application.status === 'CLOSED' || application.status === 'REJECTED') {
            throw new Error('Error: Application is already closed or rejected.');
        }

        // Update the application with the rejection status and reason
        application.status = 'REJECTED';  // Set status to "REJECTED"
        application.closeReason = reason;  // Attach the reason for rejection
        application.rejectingEntity = rejectingEntity;  // Set the rejecting entity (Bank Employee or User)

        // Store the updated application back into the ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        console.info('Application ${applicationID} has been rejected with reason: ${reason} by ${rejectingEntity}.');

        return JSON.stringify(application);
    }


    // Function to load participants’ data (mock function for demonstration)
    async loadParticipantsData(ctx, directoryPath) {
        console.info('Loading participants data from directory: ${directoryPath}');

        // In a real implementation, you would load actual data from the directory.
        // For this example, we assume the participants are predefined.
        const applicant = 'app';            // Applicant entity
        const beneficiary = 'ben';          // Beneficiary entity
        const issuingBank = 'b1';           // Issuing Bank entity
        const exportingBank = 'b2';         // Exporting Bank entity

        return { applicant, beneficiary, issuingBank, exportingBank };
    }


    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }
        return applicationAsBytes.toString();
    }
}








    // Algorithm 5 






class ApproveApplication extends Contract {

    // Function to approve an application and mark it as "APPROVED"
    async approveApplication(ctx, directoryPath, applicationID, appr) {
        console.info('Approving application ${applicationID}...');

        // Fetch the application asset from the ledger using the application ID
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error('Application with ID ${applicationID} does not exist');
        }

        // Parse the application data
        const application = JSON.parse(applicationAsBytes.toString());

        // Check if the application is in a state that can be approved
        const restrictedStatuses = ['CLOSED', 'REJECTED', 'APPROVED', 'SHIPPED', 'RECEIVED', 'READY_FOR_PAYMENT'];
        if (restrictedStatuses.includes(application.status)) {
            throw new Error('Error: Application cannot be approved due to its current status.');
        }

        // Update the application with the approval status and approving entity
        application.status = 'APPROVED';  // Set status to "APPROVED"
        application.approvingEntity = appr;  // Attach the approving entity

        // Store the updated application back into the ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        console.info('Application ${applicationID} has been approved by ${appr}.');

        return JSON.stringify(application);
    }

    // Function to load participants’ data (mock function for demonstration)
    async loadParticipantsData(ctx, directoryPath) {
        console.info('Loading participants data from directory: ${directoryPath}');

        // In a real implementation, you would load actual data from the directory.
        // For this example, we assume the participants are predefined.
        const applicant = 'app';            // Applicant entity
        const beneficiary = 'ben';          // Beneficiary entity
        const issuingBank = 'b1';           // Issuing Bank entity
        const exportingBank = 'b2';         // Exporting Bank entity

        return { applicant, beneficiary, issuingBank, exportingBank };
    }

    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error('Application with ID ${applicationID} does not exist');
        }
        return applicationAsBytes.toString();
    }
}




// Algorithm 6




class ShipProduct extends Contract {

    // Function to mark an application as "SHIPPED" based on the provided product ID
    async shipProduct(ctx, directoryPath, applicationID, productIdentificationNo) {
        console.info(`Shipping product for application ${applicationID}...`);

        // Fetch the application asset from the ledger using the application ID
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        // Parse the application data
        const application = JSON.parse(applicationAsBytes.toString());

        // Check if the application is in a state that allows shipping
        if (application.status === 'CLOSED' || application.status === 'REJECTED') {
            throw new Error('Error: Application is closed previously.');
        }

        if (application.status === 'AWAITING_APPROVAL') {
            throw new Error('Error: Shipping can’t be done before full approval.');
        }

        if (application.status === 'SHIPPED') {
            throw new Error('Error: Shipping is already done.');
        }

        // If the application is approved, proceed with shipping
        if (application.status === 'APPROVED') {
            application.status = 'SHIPPED';  // Set status to "SHIPPED"
            application.evidence = productIdentificationNo;  // Attach the product identification number
        } else {
            throw new Error('Error: Application is not in an approvable state for shipping.');
        }

        // Store the updated application back into the ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        console.info(`Application ${applicationID} has been updated to SHIPPED with product ID: ${productIdentificationNo}.`);

        return JSON.stringify(application);
    }

    // Function to load participants’ data (mock function for demonstration)
    async loadParticipantsData(ctx, directoryPath) {
        console.info(`Loading participants data from directory: ${directoryPath}`);

        // In a real implementation, you would load actual data from the directory.
        // For this example, we assume the participants are predefined.
        const applicant = 'app';            // Applicant entity
        const beneficiary = 'ben';          // Beneficiary entity
        const issuingBank = 'b1';           // Issuing Bank entity
        const exportingBank = 'b2';         // Exporting Bank entity

        return { applicant, beneficiary, issuingBank, exportingBank };
    }

    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }
        return applicationAsBytes.toString();
    }
}





// Algorithm 7 




class ReceiveProduct extends Contract {

    // Function to mark an application as "RECEIVED" based on the product shipping status
    async receiveProduct(ctx, directoryPath, applicationID) {
        console.info(`Receiving product for application ${applicationID}...`);

        // Fetch the application asset from the ledger using the application ID
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        // Parse the application data
        const application = JSON.parse(applicationAsBytes.toString());

        // Check if the application is in a state that allows receiving
        if (application.status === 'CLOSED' || application.status === 'REJECTED') {
            throw new Error('Error: Application is closed previously.');
        }

        if (application.status === 'AWAITING_APPROVAL' || application.status === 'APPROVED') {
            throw new Error('Error: Product needs to be shipped before it can be received.');
        }

        if (application.status === 'RECEIVED') {
            throw new Error('Error: Product has already been received.');
        }

        // If the product is shipped, proceed with receiving
        if (application.status === 'SHIPPED') {
            application.status = 'RECEIVED';  // Set status to "RECEIVED"
        } else {
            throw new Error('Error: Product has not been shipped.');
        }

        // Store the updated application back into the ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        console.info(`Application ${applicationID} has been updated to RECEIVED.`);

        return JSON.stringify(application);
    }

    // Function to load participants’ data (mock function for demonstration)
    async loadParticipantsData(ctx, directoryPath) {
        console.info(`Loading participants data from directory: ${directoryPath}`);

        // In a real implementation, you would load actual data from the directory.
        // For this example, we assume the participants are predefined.
        const applicant = 'app';            // Applicant entity
        const beneficiary = 'ben';          // Beneficiary entity
        const issuingBank = 'b1';           // Issuing Bank entity
        const exportingBank = 'b2';         // Exporting Bank entity

        return { applicant, beneficiary, issuingBank, exportingBank };
    }

    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }
        return applicationAsBytes.toString();
    }
}



// Algorithm 8 



class ReadyForPayment extends Contract {

    // Function to mark an application as "READY_FOR_PAYMENT" based on product receipt status
    async readyForPayment(ctx, directoryPath, applicationID) {
        console.info(`Setting application ${applicationID} to READY_FOR_PAYMENT...`);

        // Fetch the application asset from the ledger using the application ID
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        // Parse the application data
        const application = JSON.parse(applicationAsBytes.toString());

        // Check if the application is in a state that allows payment
        if (application.status === 'CLOSED' || application.status === 'REJECTED') {
            throw new Error('Error: Application is closed previously.');
        }

        if (application.status === 'READY_FOR_PAYMENT') {
            throw new Error('Error: Payment was done previously.');
        }

        if (application.status === 'RECEIVED') {
            // Update the application status to "READY_FOR_PAYMENT"
            application.status = 'READY_FOR_PAYMENT';
        } else {
            throw new Error('Error: Can’t make payment before product is received.');
        }

        // Store the updated application back into the ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        console.info(`Application ${applicationID} has been updated to READY_FOR_PAYMENT.`);

        return JSON.stringify(application);
    }

    // Function to load participants’ data (mock function for demonstration)
    async loadParticipantsData(ctx, directoryPath) {
        console.info(`Loading participants data from directory: ${directoryPath}`);

        // In a real implementation, you would load actual data from the directory.
        // For this example, we assume the participants are predefined.
        const applicant = 'app';            // Applicant entity
        const beneficiary = 'ben';          // Beneficiary entity
        const issuingBank = 'b1';           // Issuing Bank entity
        const exportingBank = 'b2';         // Exporting Bank entity

        return { applicant, beneficiary, issuingBank, exportingBank };
    }

    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }
        return applicationAsBytes.toString();
    }
}





// Algorithm 9 





class CloseApplication extends Contract {

    // Function to close an application based on the current status and provided closing reason
    async closeApplication(ctx, directoryPath, applicationID, closingReason) {
        console.info(`Closing application ${applicationID} with reason: ${closingReason}`);

        // Fetch the application asset from the ledger using the application ID
        const applicationAsBytes = await ctx.stub.getState(applicationID);
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }

        // Parse the application data
        const application = JSON.parse(applicationAsBytes.toString());

        // Check if the application is already closed or rejected
        if (application.status === 'CLOSED' || application.status === 'REJECTED') {
            throw new Error('Error: Application is closed previously.');
        }

        // Check if the application is in "READY_FOR_PAYMENT" status
        if (application.status === 'READY_FOR_PAYMENT') {
            // Update the application status to "CLOSED" and set the closing reason
            application.status = 'CLOSED';
            application.closeReason = closingReason;
        } else {
            // If the application is not ready for payment, throw an error
            throw new Error('Error: Full approval is required before closing the application.');
        }

        // Store the updated application back into the ledger
        await ctx.stub.putState(applicationID, Buffer.from(JSON.stringify(application)));
        console.info(`Application ${applicationID} has been updated to CLOSED with reason: ${closingReason}.`);

        return JSON.stringify(application);
    }

    // Function to load participants’ data (mock function for demonstration)
    async loadParticipantsData(ctx, directoryPath) {
        console.info(`Loading participants data from directory: ${directoryPath}`);

        // In a real implementation, you would load actual data from the directory.
        // For this example, we assume the participants are predefined.
        const applicant = 'app';            // Applicant entity
        const beneficiary = 'ben';          // Beneficiary entity
        const issuingBank = 'b1';           // Issuing Bank entity
        const exportingBank = 'b2';         // Exporting Bank entity

        return { applicant, beneficiary, issuingBank, exportingBank };
    }

    // Function to get the details of an existing application by ID
    async getApplication(ctx, applicationID) {
        const applicationAsBytes = await ctx.stub.getState(applicationID); // Get the application from ledger
        if (!applicationAsBytes || applicationAsBytes.length === 0) {
            throw new Error(`Application with ID ${applicationID} does not exist`);
        }
        return applicationAsBytes.toString();
    }
}
module.exports = SmartContract;




