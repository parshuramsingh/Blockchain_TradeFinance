# TradeChain – Blockchain Trade Finance Solution  
*A secure, scalable, and privacy-first trade finance platform powered by Hyperledger Fabric*

![Hyperledger Fabric](https://img.shields.io/badge/Blockchain-Hyperledger%20Fabric-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)

---

## 📌 Overview

**TradeChain** is a permissioned blockchain platform developed to modernize the **import-export trade finance lifecycle**, replacing traditional intermediaries with a **smart contract-governed**, **role-based**, and **secure digital workflow**.

> 🔗 Built on **Hyperledger Fabric**, this system enforces strict multi-stage trade workflows between four key participants: **Applicant**, **Applicant's Bank**, **Beneficiary**, and **Beneficiary's Bank**.

> 💡 Through automation, privacy, and performance, TradeChain reduces the trade lifecycle from **14 steps** to **7**, and achieves up to **800 TPS** under test conditions.

> 🚫 **Live Link Unavailable**:  
Live deployment is not publicly hosted due to the project's complex Hyperledger Fabric setup. It requires Docker-based orchestration of peers, orderers, and Fabric CA, which needs cloud infrastructure (e.g., multiple AWS VMs). This makes a public live demo **impractical without enterprise-level hosting**.

---

## 📚 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Performance Benchmarking](#-performance-benchmarking)
- [Tech Stack](#-tech-stack)
- [Smart Contract Workflow](#-smart-contract-workflow)
- [Future Roadmap](#-future-roadmap)
- [Author](#-author)
- [License](#-license)

---

## 🔧 Features

- ✅ **Smart Contracts** enforcing 7-step trade lifecycles (`TradeFinance.js`)
- 🔐 **Role-Based Access Control** with Fabric CA & MSP
- 📦 **Node.js CLI** to trigger and validate transactions
- 📊 **Caliper Performance Benchmarks** (800 TPS, 100% success)
- ⚖️ **MVCC & PBFT** for concurrency and tamper-proof consensus
- 🔄 Realistic workflow stress testing using modular workload modules

---

## 🧠 Architecture

```
+-----------------------------+
|       Node.js CLI          |
+-------------+--------------+
              |
       [fabric-network SDK]
              |
+-----------------------------+
|    Hyperledger Fabric 2.x   |
|  ├── Orderer                |
|  ├── Peers + CouchDB        |
|  ├── Fabric CA              |
|  └── TradeFinance.js Chaincode |
+-----------------------------+
              |
+-----------------------------+
|     Dockerized Network      |
+-----------------------------+
```

> 🔎 Participants:  
> - `app` (Applicant)  
> - `b1` (Applicant’s Bank)  
> - `b2` (Beneficiary’s Bank)  
> - `ben` (Beneficiary)

---

## 📊 Performance Benchmarking

Powered by **Hyperledger Caliper**, the system was tested for:

- 🔁 **Throughput**: Up to **1600 TPS**
- ⏱️ **Latency**: Under **1.2 seconds**
- ✅ **Success Rate**: 100% for 32000 test transactions
- 🧪 **Real-World Workflow**: `create-application → approvals → shipping → receipt → payment`

```bash
cd benchmark
npx caliper launch manager   --caliper-config caliper-config.yaml   --caliper-benchmark benchmark-config.yaml
```

> 📈 Performance shows horizontal scalability and low-latency under concurrent loads (20–800 TPS tested).

---

## 🛠️ Tech Stack

| Layer           | Technology              |
|----------------|--------------------------|
| Blockchain      | Hyperledger Fabric v2.x |
| Smart Contracts | JavaScript Chaincode    |
| Backend         | Node.js SDK             |
| Benchmarking    | Hyperledger Caliper     |
| Containers      | Docker, Docker Compose  |

---

## 🧾 Smart Contract Workflow

TradeChain simplifies the traditional 14-step import/export process into a **7-step permissioned model**:

1. `create-application` – Initiated by Applicant (app)
2. `approve-by-issuing-bank` – Approved by Bank b1
3. `approve-by-beneficiary-bank` – Approved by Bank b2
4. `approve-and-ship-by-beneficiary` – Shipment by Beneficiary (ben)
5. `confirm-receipt-by-applicant` – Receipt by Applicant (app)
6. `prepare-for-payment` – Payment prepared by Bank b1
7. `finalize-payment` – Finalized by Bank b2 (Status: CLOSED)

### Access Control

- **Applicant (`app`)**: Initiates applications, confirms receipts
- **Beneficiary (`ben`)**: Ships goods
- **Bank b1**: Approves and prepares payments
- **Bank b2**: Approves & finalizes transactions

All permissions enforced using **Fabric’s Attribute-Based Access Control (ABAC)**.

---

## 🚀 Future Roadmap

TradeChain is production-ready and will soon undergo:

- 🌐 **Production Deployment** with 5–10 trade entities
- 🧩 **API Integration** with banking & trade systems (e.g. SWIFT)
- 🔐 **Advanced Security**: zk-SNARKs, Microsoft SEAL
- 📱 **React.js Dashboard**: Real-time trade tracking UI
- 🌍 **Cross-Border Payments**: RippleNet + Stablecoins (USDC)
- 📡 **IoT Integration**: GPS data auto-logged on-chain
- ⚖️ **Compliance**: GDPR, KYC/AML, EU standards
- 🧬 **Interoperability**: Hyperledger Cactus for cross-chain support


---

## ✍️ Author

**Parshuram Singh**  
*Blockchain-Focused Full Stack Developer*  
🔗 [LinkedIn](https://www.linkedin.com/in/parshuramsingh)

> 🎓 B.Tech – Information Technology (2025)  
> Rajkiya Engineering College, Ambedkar Nagar  


---

## 📃 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full details.

---


> 📢 *TradeChain demonstrates how blockchain can disrupt global trade by removing middlemen, enforcing transparency, and accelerating cross-border operations with cryptographic trust.*
