# 🏥 Hospital Management System (HMS)

A modern, full-fledged Hospital Management System designed to handle daily hospital operations effortlessly. It provides dedicated interfaces for Admins, Doctors, Receptionists, and Patients, seamlessly integrating AI workflows and payment gateways.

---

## ✨ Features

* **🔐 Role-Based Access Control (RBAC):** Secure authentication and authorization using JWT. Dedicated dashboards for:
  * **Admin:** Manage doctors, patients, and hospital analytics.
  * **Doctor:** View appointments, manage schedules, and access patient records.
  * **Receptionist:** Register patients, handle billing, and coordinate schedules.
  * **Patient:** Book appointments, access medical history, and pay bills.
* **🤖 AI ChatBot Integration:** Powered by Google Gemini AI to assist patients with basic queries.
* **💳 Payment Gateway:** Razorpay integration for seamless and secure online billing/payments.
* **✉️ Email Notifications:** Automated appointment confirmations and alerts via SendGrid.
* **🗺️ Hospital Location:** Interactive maps for users leveraging Google Maps API.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React.js powered by Vite
* **Language:** TypeScript
* **Styling:** CSS / UI Components
* **Routing:** React Router

### Backend
* **Framework:** Spring Boot (Java)
* **Security:** Spring Security + JWT Tokens
* **Build Tool:** Maven
* **Database:** (Configurable via standard Spring Data JPA / Hibernate)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v16+)
* [Java JDK](https://adoptium.net/) (v17 or higher recommended)
* [Maven](https://maven.apache.org/)

### 1. Clone the repository
```bash
git clone https://github.com/cdtankit128/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend/HMS
   ```
2. Create your environment configuration file:
   Rename or copy `.env.example` to `.env.properties` and fill in your actual database credentials and API keys. **(Never commit this file!)**
3. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   Rename or copy `.env.example` to `.env.local` and add your frontend API keys (e.g., Google Maps API Key).
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Environment Variables

This project uses various external APIs. You must obtain keys for the following services:
* **Google Gemini API** (AI ChatBot)
* **Razorpay** (Payments)
* **SendGrid** (Email Delivery)
* **Google Maps API** (Maps & Location)
* **Secret Key** (For signing JWT auth tokens)

**Note on Git Hooks:** 
This repository contains a `husky` and `gitleaks` pre-commit hook to prevent the accidental push of API keys and secrets. Do not bypass this hook unless absolutely necessary.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check out the [issues page](https://github.com/cdtankit128/Hospital-Management-System/issues) if you want to contribute.
