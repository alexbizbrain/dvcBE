# Admin Customer Queries API Guide

## 🔐 Authentication

### Admin Login
**Endpoint:** `POST /admin/auth/login`

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "cm123abc",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }
}
```

### Authorization Header
All admin endpoints require JWT token:
```
Authorization: Bearer {accessToken}
```

---

## 📊 Admin Customer Queries Endpoints

### 1. Get All Customer Queries (Paginated)
**Endpoint:** `GET /admin/customer-queries`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search across firstName, lastName, email
- `email` (optional): Filter by email contains
- `name` (optional): Search by first or last name

**Examples:**
```bash
GET /admin/customer-queries
GET /admin/customer-queries?page=2&limit=20
GET /admin/customer-queries?search=john
GET /admin/customer-queries?email=gmail.com
GET /admin/customer-queries?name=smith&page=1&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm123def",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890",
      "countryCode": "+1",
      "message": "I need help with my insurance claim...",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Get Single Customer Query
**Endpoint:** `GET /admin/customer-queries/:id`

**Example:**
```bash
GET /admin/customer-queries/cm123def
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm123def",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "countryCode": "+1",
    "message": "I need help with my insurance claim...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Delete Customer Query
**Endpoint:** `DELETE /admin/customer-queries/:id`

**Example:**
```bash
DELETE /admin/customer-queries/cm123def
```

**Response:**
```json
{
  "success": true,
  "message": "Customer query deleted successfully"
}
```

---

## 🛡️ Security & Access Control

### Guards Applied:
- **JwtAuthGuard**: Validates JWT token
- **AdminGuard**: Ensures user has ADMIN role

### Access Requirements:
1. Valid JWT token in Authorization header
2. User must have role "ADMIN"
3. User account must be active

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden (Non-Admin User)
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
  "message": "Customer query not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to retrieve customer queries",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

---

## 🔍 Search Functionality

### General Search (`search` parameter):
Searches across: `firstName`, `lastName`, `email` (case insensitive)

### Email Filter (`email` parameter):
Filters records where email contains the specified string

### Name Search (`name` parameter):
Searches in both `firstName` and `lastName` fields

### Example Combinations:
```bash
# Search for "john" in any field, page 2, 20 items
GET /admin/customer-queries?search=john&page=2&limit=20

# Filter Gmail users only
GET /admin/customer-queries?email=gmail.com

# Find all users with "smith" in their name
GET /admin/customer-queries?name=smith
```

---

## 📊 Pagination Details

### Parameters:
- **page**: Integer (min: 1, default: 1)
- **limit**: Integer (min: 1, max: 100, default: 10)

### Pagination Response:
- **page**: Current page number
- **limit**: Items per page
- **total**: Total number of records
- **totalPages**: Total pages available
- **hasNext**: Boolean - more pages available
- **hasPrev**: Boolean - previous pages available

---

## 🚀 Base URL
Development: `http://localhost:4000`
Production: `{your-production-url}`