const fs = require('fs');
const { Wallets } = require('fabric-network');

async function extractIdentity() {
    try {
        const walletPath = '/home/fabric/fabric-samples/asset-transfer-basic/my-application/wallet';
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        const identity = await wallet.get('appUser'); // Matches your 'appUser' from enroll
        if (!identity) {
            throw new Error('Identity "appUser" not found in wallet. Run enroll commands first.');
        }

        // Extract certificate and private key
        const cert = identity.credentials.certificate;
        const key = identity.credentials.privateKey;

        // Save to files with overwrite protection
        const certPath = `${walletPath}/appUser.crt`;
        const keyPath = `${walletPath}/appUser.key`;
        if (fs.existsSync(certPath) || fs.existsSync(keyPath)) {
            console.log('Warning: Existing files will be overwritten.');
        }
        fs.writeFileSync(certPath, cert);
        fs.writeFileSync(keyPath, key);

        console.log('✅ Extracted appUser.crt and appUser.key successfully!');
        console.log(`Files saved to: ${walletPath}`);
    } catch (error) {
        console.error('❌ Failed to extract identity:', error.message);
    }
}

extractIdentity();
