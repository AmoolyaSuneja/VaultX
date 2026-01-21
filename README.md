<<<<<<< HEAD
# VaultX
project focuses on strong encryption, secure access control, and data privacy, ensuring that user data remains protected both at rest and during access. Built with a security-first approach, the vault aims to provide a reliable and scalable solution for safeguarding confidential files and credentials.
=======
# Secure Digital Vault - Week 2 MVP

## Overview
This is the Week 2 MVP of the Secure Digital Vault project. It establishes a functional backend processing pipeline with a working API endpoint, input validation, and structured responses.

## Project Structure
```
secure-vault/
├── src/
│   ├── server.js                 # Express server setup
│   ├── routes/
│   │   └── vaultRoutes.js        # API route definitions
│   ├── controllers/
│   │   └── vaultController.js    # Business logic
│   └── middleware/
│       └── validateVaultInput.js # Input validation
├── .env                          # Environment variables
└── package.json                  # Dependencies
```

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Server

```bash
npm start
```

The server will start on port 3000 (or the port specified in `.env`).

## API Endpoints

### POST /api/vault/preview

Accepts vault data and returns metadata.

**Request:**
```json
{
  "data": "string"
}
```

**Success Response (200):**
```json
{
  "status": "received",
  "originalLength": 15,
  "storedAt": "2024-12-19T10:30:45.123Z",
  "note": "Data will be encrypted in next phase"
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Field 'data' is required in request body"
}
```

## Testing

You can test the API using curl:

```bash
# Valid request
curl -X POST http://localhost:3000/api/vault/preview \
  -H "Content-Type: application/json" \
  -d '{"data": "My sensitive information"}'

# Invalid request (missing data)
curl -X POST http://localhost:3000/api/vault/preview \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid request (empty data)
curl -X POST http://localhost:3000/api/vault/preview \
  -H "Content-Type: application/json" \
  -d '{"data": ""}'
```

## Week 2 Features

- ✅ Running Express server
- ✅ REST API endpoint (POST /api/vault/preview)
- ✅ Input validation middleware
- ✅ Request processing logic
- ✅ Structured JSON responses

## Next Steps (Future Weeks)

- Encryption implementation
- Database integration
- Authentication system
- Conditional access control rules

>>>>>>> bd8358e (Made a simple server and an api endpoint)
