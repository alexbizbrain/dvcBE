# Admin Auth Migration Guide

## 🔄 Breaking Changes - Frontend Update Required

This guide outlines the changes made to the authentication system to make it admin-specific. **All frontend code using the old auth endpoints needs to be updated.**

---

## 📍 Endpoint Changes

### **OLD vs NEW Endpoints**

| **OLD Endpoint** | **NEW Endpoint** | **Status** |
|------------------|------------------|------------|
| `POST /auth/login` | `POST /admin/auth/login` | ✅ **CHANGED** |
| `POST /auth/logout` | `POST /admin/auth/logout` | ✅ **CHANGED** |
| `GET /auth/profile` | `GET /admin/auth/profile` | ✅ **CHANGED** |

### **URL Migration**
```diff
- POST /auth/login
+ POST /admin/auth/login

- POST /auth/logout  
+ POST /admin/auth/logout

- GET /auth/profile
+ GET /admin/auth/profile
```

---

## 📦 Request/Response Changes

### **1. Login Response Structure**

**OLD Response Format:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm123abc",
    "email": "admin@example.com", 
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }
}
```

**NEW Response Format:**
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

**📝 Key Change:** `user` → `admin` in response object

### **2. Profile Response Structure**

**OLD Response Format:**
```json
{
  "user": {
    "id": "cm123abc",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User", 
    "role": "ADMIN"
  }
}
```

**NEW Response Format:**
```json
{
  "admin": {
    "id": "cm123abc",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }
}
```

**📝 Key Change:** `user` → `admin` in response object

### **3. Logout Response**

**OLD Response:**
```json
{
  "message": "Logged out successfully"
}
```

**NEW Response:**
```json
{
  "message": "Admin logged out successfully"
}
```

---

## 🔧 Frontend Code Migration Examples

### **JavaScript/TypeScript Updates**

#### **Login Function Update:**
```diff
const adminLogin = async (credentials) => {
  try {
-   const response = await fetch('/auth/login', {
+   const response = await fetch('/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.success) {
-     const user = data.user;
+     const admin = data.admin;
-     localStorage.setItem('user', JSON.stringify(user));
+     localStorage.setItem('admin', JSON.stringify(admin));
      localStorage.setItem('token', data.accessToken);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

#### **Profile Fetch Update:**
```diff
const getAdminProfile = async () => {
  try {
-   const response = await fetch('/auth/profile', {
+   const response = await fetch('/admin/auth/profile', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
-   return data.user;
+   return data.admin;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};
```

#### **Logout Function Update:**
```diff
const adminLogout = async () => {
  try {
-   const response = await fetch('/auth/logout', {
+   const response = await fetch('/admin/auth/logout', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });
    
    // Clear stored data
-   localStorage.removeItem('user');
+   localStorage.removeItem('admin');
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### **React Hook Updates:**

#### **Authentication Context Update:**
```diff
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
- const [user, setUser] = useState(null);
+ const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (credentials) => {
-   const response = await fetch('/auth/login', {
+   const response = await fetch('/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    if (data.success) {
-     setUser(data.user);
+     setAdmin(data.admin);
      setToken(data.accessToken);
-     localStorage.setItem('user', JSON.stringify(data.user));
+     localStorage.setItem('admin', JSON.stringify(data.admin));
      localStorage.setItem('token', data.accessToken);
    }
  };

  return (
-   <AuthContext.Provider value={{ user, token, login }}>
+   <AuthContext.Provider value={{ admin, token, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🚨 Error Handling Updates

### **Error Message Changes**

**OLD Error Messages:**
- "Invalid credentials"
- "User not authenticated"
- "Account is inactive"

**NEW Error Messages:**
- "Invalid admin credentials"
- "Admin not authenticated"
- "Admin account is inactive"

### **Updated Error Handling:**
```diff
const handleAuthError = (error) => {
  if (error.status === 401) {
-   console.error('User authentication failed');
+   console.error('Admin authentication failed');
  } else if (error.status === 403) {
-   console.error('User not authorized');
+   console.error('Admin access required');
  }
};
```

---

## ✅ Migration Checklist

### **Required Frontend Changes:**

- [ ] **Update all auth endpoint URLs** to include `/admin` prefix
- [ ] **Change response object access** from `data.user` to `data.admin`
- [ ] **Update localStorage/sessionStorage keys** from `user` to `admin`
- [ ] **Modify state management** (Redux, Context, etc.) variable names
- [ ] **Update error message handling** for admin-specific messages
- [ ] **Change profile endpoint calls** to new admin profile endpoint
- [ ] **Update logout endpoint calls** to new admin logout endpoint
- [ ] **Modify component props/state** that reference `user` to `admin`

### **Testing Checklist:**

- [ ] **Login flow** works with new endpoint
- [ ] **Token storage** and retrieval working correctly
- [ ] **Profile fetching** returns admin data correctly
- [ ] **Logout flow** clears admin data properly
- [ ] **Error handling** shows appropriate admin messages
- [ ] **Route protection** still works with new admin structure
- [ ] **API calls** to protected endpoints still authenticate properly

---

## 🔍 Verification Steps

1. **Test Login:**
   ```bash
   curl -X POST http://localhost:4000/admin/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email":"admin@example.com","password":"Admin@123"}'
   ```

2. **Test Profile (with token):**
   ```bash
   curl -X GET http://localhost:4000/admin/auth/profile \
   -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Test Logout (with token):**
   ```bash
   curl -X POST http://localhost:4000/admin/auth/logout \
   -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 📞 Support

If you encounter issues during migration:
1. Verify all endpoint URLs are updated
2. Check that response object properties are correctly accessed
3. Ensure JWT tokens are still being sent in Authorization headers
4. Confirm error handling accounts for new admin-specific messages

**⚠️ Important:** The old `/auth/*` endpoints are no longer available. All authentication must use the new `/admin/auth/*` endpoints.