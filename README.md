# Bachelor - Food Transport Management System – Edge Monitoring & Back Office Platform

A scalable fullstack platform designed for real-time environmental monitoring, fleet management, and automated compliance reporting in food cold-chain logistics. Developed as part of the Bachelor Thesis project at the University of Agder (UiA) (August 2024 – December 2024).

---

## 📌 Project Overview
Ensuring food quality and safety during transport requires continuous environmental monitoring and strict data documentation. This project delivers an end-to-end IoT and Back Office solution that captures real-time sensor data, visualizes vehicle positions on dynamic maps, enforces Role-Based Access Control (RBAC), and generates automated compliance reports for quality assurance.

---

## 🚀 Key Features

### 1. Real-Time Transport & Fleet Monitoring (Back Office)
* **Live Vehicle Tracking:** Dynamic visual mapping of transport vehicles and route telemetry.
* **Environmental Sensor Tracking:** Monitors cold-chain environmental parameters to prevent food spoilage during transit.
* **Role-Based Access Control (RBAC):** Secure authentication and authorization powered by Firebase Auth, tailoring view permissions according to user roles.
* **Modular Fleet Registration:** Interface for registering and managing transport units, sensors, and operational profiles.

### 2. Python Sensor Simulation & PDF Report Generation
* **Python Telemetry Engine:** Built-in Python models generating synthetic sensor telemetry for stress-testing, data analysis, and system verification.
* **Automated PDF Export:** Integrated PDF generator using `jsPDF` and `jsPDF-AutoTable`, enabling users to export telemetry logs and audit trails directly from the web interface.
* **Role-Adaptive Reporting:** Document exports automatically adjust content and detail levels based on the user's RBAC privileges.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, JavaScript, HTML5, CSS3
* **Backend & Database:** Firebase (Cloud Firestore, Firebase Authentication)
* **Data Processing & Simulation:** Python
* **Reporting & Export:** `jsPDF`, `jsPDF-AutoTable`
* **Methodology:** Scrum / Agile Development

---

## 🏗️ System Architecture

```text
 [ Python Telemetry Simulator ] 
              │ (Synthetic Sensor Data)
              ▼
[ Cold-Chain Sensors / Vehicles ] ──► [ Firebase Firestore ] ◄──► [ React Back Office Dashboard ]
                                              │                                  │
                                    (Auth & RBAC State)            (jsPDF Compliance Export)

👥 Agile Methodology & Role
Role: Scrum Master & Fullstack Developer

Responsibilities: Led Agile sprint planning, stand-ups, and retrospectives while contributing directly to frontend/backend integrations, Python sensor modeling, and PDF report workflows.

👤 Author
Abdullahi Mohamed Abdiwali
