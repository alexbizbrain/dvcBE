# Admin Liability Claims API Implementation Guide

## 🔐 Authentication Required
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer {accessToken}
```

## 📍 Base URL
All endpoints use `/admin/liability-claims` prefix

---

## 🔗 API Endpoints

### 1. Create Liability Claim
**Endpoint:** `POST /admin/liability-claims`

**Request Body:**
```json
{
  "email": "john@example.com",          // Optional - but email OR phone required
  "phoneNumber": "+1234567890",         // Optional - but email OR phone required  
  "countryCode": "us",                  // Optional, defaults to "us"
  "atFaultDriver": true,                // Required - boolean
  "state": "California",                // Required - string
  "agreeToEmails": false,               // Optional, defaults to false
  "agreeToSms": true                    // Optional, defaults to false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Liability claim created successfully",
  "data": {
    "id": "cm456def",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "countryCode": "us",
    "atFaultDriver": true,
    "state": "California",
    "agreeToEmails": false,
    "agreeToSms": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Liability Claims (Paginated)
**Endpoint:** `GET /admin/liability-claims`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search across email, phone, state
- `email` (optional): Filter by email contains
- `state` (optional): Filter by state contains
- `countryCode` (optional): Filter by country code ("us")
- `atFaultDriver` (optional): Filter by fault status (true/false)

**Examples:**
```bash
GET /admin/liability-claims
GET /admin/liability-claims?page=2&limit=20
GET /admin/liability-claims?search=california
GET /admin/liability-claims?email=gmail.com&atFaultDriver=true
GET /admin/liability-claims?state=texas&page=1&limit=5
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm456def",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "countryCode": "us",
      "atFaultDriver": true,
      "state": "California",
      "agreeToEmails": false,
      "agreeToSms": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Get Single Liability Claim
**Endpoint:** `GET /admin/liability-claims/:id`

**Example:**
```bash
GET /admin/liability-claims/cm456def
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cm456def",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "countryCode": "us",
    "atFaultDriver": true,
    "state": "California",
    "agreeToEmails": false,
    "agreeToSms": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Liability Claim
**Endpoint:** `PUT /admin/liability-claims/:id`

**Request Body (all fields optional):**
```json
{
  "email": "newemail@example.com",
  "phoneNumber": "+0987654321",
  "countryCode": "us",
  "atFaultDriver": false,
  "state": "New York",
  "agreeToEmails": true,
  "agreeToSms": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Liability claim updated successfully",
  "data": {
    "id": "cm456def",
    "email": "newemail@example.com",
    "phoneNumber": "+0987654321",
    "countryCode": "us",
    "atFaultDriver": false,
    "state": "New York",
    "agreeToEmails": true,
    "agreeToSms": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

### 5. Delete Liability Claim
**Endpoint:** `DELETE /admin/liability-claims/:id`

**Example:**
```bash
DELETE /admin/liability-claims/cm456def
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Liability claim deleted successfully"
}
```

---

## 🛡️ Error Responses

### 400 Bad Request
```json
{
  "message": "Either email or phone number is required",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "Liability claim not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to retrieve liability claims",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

---

## 📊 Data Types & Validation

### Field Specifications:
- **id**: String (CUID format)
- **email**: String (optional, valid email format)
- **phoneNumber**: String (optional, any format)
- **countryCode**: String (optional, only "us" accepted currently)
- **atFaultDriver**: Boolean (required for create, optional for update)
- **state**: String (required for create, optional for update)
- **agreeToEmails**: Boolean (optional, defaults to false)
- **agreeToSms**: Boolean (optional, defaults to false)
- **createdAt**: ISO 8601 date string
- **updatedAt**: ISO 8601 date string

### Validation Rules:
- At least one of `email` or `phoneNumber` must be provided
- `countryCode` must be "us" if provided
- `state` is required when creating
- All boolean fields accept true/false only

---

## 🔍 Search Functionality

### General Search (`search` parameter):
Searches across: `email`, `phoneNumber`, `state` (case insensitive)

### Specific Filters:
- **email**: Partial match in email field
- **state**: Partial match in state field  
- **countryCode**: Exact match ("us")
- **atFaultDriver**: Exact boolean match (true/false)

### Filter Combinations:
```bash
# Search for California claims with fault drivers
GET /admin/liability-claims?state=california&atFaultDriver=true

# Search Gmail users in page 2
GET /admin/liability-claims?email=gmail.com&page=2&limit=15

# General search with pagination
GET /admin/liability-claims?search=texas&page=1&limit=25
```

---

## 📋 Frontend Implementation Checklist

### Required Features:
- [ ] **Create Form**: Email/phone validation, state input, boolean toggles
- [ ] **List View**: Pagination controls, search input, filter dropdowns
- [ ] **Detail View**: Display all claim information
- [ ] **Edit Form**: Pre-populated fields, partial updates
- [ ] **Delete Confirmation**: Modal or confirmation dialog
- [ ] **Loading States**: For all async operations
- [ ] **Error Handling**: Display validation and server errors
- [ ] **Search Interface**: General search + specific filters
- [ ] **Pagination**: Previous/next buttons, page numbers

### Data Display:
- Format dates consistently (createdAt, updatedAt)
- Show fault status clearly (Yes/No or True/False)
- Display contact info prominently (email + phone)
- Indicate agreement preferences (email/SMS)

---

## 🚀 Base URL
Development: `http://localhost:4000`
Production: `{your-production-url}`