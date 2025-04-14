# TradeChain-Blockchain-Trade-Finance-Solution

> A production-grade, privacy-aware trade finance platform built on **Hyperledger Fabric**, enabling secure, automated workflows for banks, applicants, and beneficiaries within a permissioned blockchain network.

# 🚢 TradeChain – Blockchain Trade Finance Solution

![Hyperledger Fabric](https://img.shields.io/badge/Blockchain-Hyperledger%20Fabric-blue?style=flat-square&logo=hyperledger)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=flat-square&logo=node.js)
![GitHub last commit](https://img.shields.io/github/last-commit/parshuramsingh/parshuramsingh-TradeChain-Blockchain-Trade-Finance-Solution?style=flat-square)
![GitHub Repo stars](https://img.shields.io/github/stars/parshuramsingh/parshuramsingh-TradeChain-Blockchain-Trade-Finance-Solution?style=flat-square)
![GitHub forks](https://img.shields.io/github/forks/parshuramsingh/parshuramsingh-TradeChain-Blockchain-Trade-Finance-Solution?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/parshuramsingh/parshuramsingh-TradeChain-Blockchain-Trade-Finance-Solution?style=flat-square)
![GitHub license](https://img.shields.io/github/license/parshuramsingh/parshuramsingh-TradeChain-Blockchain-Trade-Finance-Solution?style=flat-square)


---

## 📌 Project Overview

**TradeChain** addresses the complexities of trade finance by replacing manual, paper-based processes with a **secure, decentralized application** on Hyperledger Fabric. It enhances trust, transparency, and speed in trade documentation and finance operations.

> 🔐 **Permissioned Blockchain** | 📄 **Smart Contracts** | 🧾 **KYC Integration (WIP)** | ⚡ **High Performance**

---

## 🧠 Features & Contributions

| Feature | Description |
|--------|-------------|
| **⚙️ Hyperledger Fabric Setup** | Configured a permissioned blockchain (`mychannel`) using Fabric v2.5, including CA, orderers, and peer nodes. |
| **📜 Smart Contracts** | Developed `tradeFinance` chaincode in JavaScript with key transaction functions: `createApplication`, `closeApplication`. |
| **🧩 Role-based Access** | Enforced business logic for banks (b1, b2), applicants (app), and beneficiaries (ben) using participant-specific logic. |
| **🔗 CLI App Integration** | Built `myapp.js` (Node.js) using `fabric-network` SDK to interact with chaincode operations like `initLedger`. |
| **🔐 Identity Management** | Managed user identities (e.g., `appUser`) with Fabric CA, handling key-pair authentication. |
| **📊 Performance Benchmarking** | Integrated with **Hyperledger Caliper v0.6.0** to simulate up to **1000 transactions at 200 TPS** (ongoing). |
| **🛠 Deployment** | Deployed on Docker with Fabric CLI, network bootstrapped with `initLedger` for initial state. |

---

### ✅ CLI App Execution – `initLedger`
```bash
🔄 Connecting to Hyperledger Fabric network...
✅ Successfully connected to network.
🌱 Initializing Ledger...
✅ Ledger initialized with trade finance records.
