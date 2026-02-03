# 🌱 Cinnamon Plantation Management System

A comprehensive **web-based plantation management system** built using the **MERN stack (MongoDB, Express.js, React, Node.js)**, specifically designed to manage and streamline **cinnamon cultivation operations** from cultivation to customer delivery.

The system integrates multiple plantation workflows including **inventory management, sales and finance tracking, issue handling, delivery coordination, and harvest management**, providing an efficient and scalable solution for modern agricultural operations.

---

## 📌 Project Overview

Cinnamon plantation management involves complex and interconnected processes such as cultivation tracking, inventory handling, sales management, and issue resolution. Manual management methods are inefficient, time-consuming, and prone to errors.

The **Cinnamon Plantation Management System** provides a **centralized, digital platform** that automates these processes and enables plantation owners and staff to manage daily operations efficiently with real-time data visibility.

---

## 🎯 Objectives

- Digitize and automate plantation management processes  
- Improve operational efficiency and transparency  
- Enable real-time monitoring of plantation activities  
- Reduce manual errors in inventory and financial records  
- Support scalable system expansion  

---

## ✨ Key Features

### 🌿 Inventory Management
- Track cinnamon stock and raw materials  
- Monitor harvested product quantities  
- Prevent overstocking and shortages  

### 💰 Sales & Finance Management
- Record and manage sales transactions  
- Track income and financial performance  
- Support business reporting  

### 🛠️ Issue & Response Handling
- Report operational issues  
- Track issue resolution progress  
- Improve accountability and response time  

### 🚚 Delivery Coordination
- Manage customer orders  
- Track delivery status  
- Ensure timely delivery of products  

### 🌾 Harvest Management
- Record harvest details  
- Track yields by date and batch  
- Support future planning and forecasting  

### 🧑‍💻 User Interface
- Modern and responsive design  
- User-friendly navigation  
- Clean and intuitive layout  

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- HTML5  
- CSS3  
- JavaScript  

### Backend
- Node.js  
- Express.js  

### Database
- MongoDB  

### Architecture
- RESTful API architecture  
- MVC-based backend structure  

---

## 📂 Project Structure

```text
Cinnamon-Plantation-Management-System/
│
├── backend/
│   ├── config/                     # Database & environment configuration
│   │   └── db.js
│   │
│   ├── controllers/                # Business logic
│   │   ├── inventoryController.js
│   │   ├── salesController.js
│   │   ├── issueController.js
│   │   ├── deliveryController.js
│   │   └── harvestController.js
│   │
│   ├── models/                     # MongoDB schemas
│   │   ├── Inventory.js
│   │   ├── Sale.js
│   │   ├── Issue.js
│   │   ├── Delivery.js
│   │   └── Harvest.js
│   │
│   ├── routes/                     # API routes
│   │   ├── inventoryRoutes.js
│   │   ├── salesRoutes.js
│   │   ├── issueRoutes.js
│   │   ├── deliveryRoutes.js
│   │   └── harvestRoutes.js
│   │
│   ├── middleware/                 # Custom middleware
│   │   └── errorMiddleware.js
│   │
│   ├── server.js                   # Entry point
│   └── package.json
│
├── frontend/
│   ├── public/                     # Static assets
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Application pages
│   │   ├── services/               # API calls
│   │   ├── assets/                 # Images & styles
│   │   ├── App.js
│   │   └── index.js
│   │
│   └── package.json
│
├── .env                            # Environment variables
├── .gitignore
├── package.json                    # Root scripts (npm run dev)
└── README.md


## ⚙️ Installation & Setup

### Prerequisites
- Node.js
- MongoDB
- npm or yarn

### Clone the Repository
```bash
git clone https://github.com/vishmi0104/Cinnamon-Plantation-Management-System.git
cd Cinnamon-Plantation-Management-System
