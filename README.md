# 🚢 TradeChain – Blockchain Trade Finance Solution  
*A secure, permissioned trade finance platform powered by Hyperledger Fabric*

![Hyperledger Fabric](https://img.shields.io/badge/Blockchain-Hyperledger%20Fabric-blue?style=for-the-badge)  
![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)  

## 📌 Overview

**TradeChain** is a robust and privacy-focused trade finance system designed for banks, applicants, and beneficiaries. Built using **Hyperledger Fabric**, this platform ensures secure, transparent, and rule-enforced trade application processing using smart contracts and cryptographic identities.

> ⚙️ Strict state-machine logic, ⛓️ smart contract-driven workflow, and 🔒 enterprise-grade privacy.

---

## 🔧 Features

- ✅ **Smart Contracts** enforcing trade finance lifecycles (JavaScript Chaincode)
- 🔐 **Fabric CA** for role-based identity and cryptographic trust
- 📦 **Node.js CLI** tool to interact with network transactions
- 📊 **Hyperledger Caliper** benchmarks for realistic performance testing
- 🏦 Full lifecycle support: Application Creation → Multi-party Approval → Closure
- 🔄 Modular workload modules for stress testing

---

## 🧠 Architecture

```
+--------------------------+
|  Node.js CLI (User API) |
+-----------+--------------+
            |
     [fabric-network SDK]
            |
+--------------------------+
|  Hyperledger Fabric v2.x |
|  ├─ Orderer              |
|  ├─ Peers                |
|  ├─ CouchDB (State DB)   |
|  ├─ Fabric CA            |
|  └─ JS Smart Contracts   |
+--------------------------+
            |
+--------------------------+
|    Dockerized Network    |
+--------------------------+
```

---

## 📊 Performance Benchmarking

- Uses **Hyperledger Caliper** for stress-testing
- Modular workload modules simulate real-world transaction flows
- Conflict handling (MVCC), retries, and state validation built-in

```bash
cd benchmark
npx caliper launch manager --caliper-config caliper-config.yaml --caliper-benchmark benchmark-config.yaml
```

---
---

## 🛠️ Tech Stack

- **Blockchain**: Hyperledger Fabric 2.x
- **Smart Contracts**: JavaScript (Chaincode)
- **Backend**: Node.js
- **CLI Tool**: Node + fabric-network SDK
- **Benchmarking**: Hyperledger Caliper
- **Containers**: Docker, Docker Compose

---

## ✍️ Author

**Parshuram Singh**  
*Blockchain-Focused Frontend Developer*  
🔗 [LinkedIn](https://www.linkedin.com/in/parshuramsingh) |

---

## 📃 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
