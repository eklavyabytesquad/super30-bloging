# BlogHub Authentication Setup Guide

## 🚀 Complete Custom Authentication System

Your BlogHub application now has a fully functional custom authentication system using SHA-256 password hashing and custom token management.

## 📋 Prerequisites

1. **Install Supabase package**:
   ```bash
   npm install @supabase/supabase-js
   ```

## 🗄️ Database Setup

### Step 1: Create Users Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  age INTEGER CHECK (age > 0 AND age < 150),
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'EDITOR')) DEFAULT 'EDITOR'
);

-- Create indexes for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Step 2: Create User Tokens Table

```sql
CREATE TABLE user_tokens (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
  logout_time TIMESTAMP WITH TIME ZONE,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB
);

-- Create indexes
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token);
CREATE INDEX idx_user_tokens_expired_at ON user_tokens(expired_at);
CREATE INDEX idx_user_tokens_logout_time ON user_tokens(logout_time) WHERE logout_time IS NULL;
```

### Step 3: Enable Row Level Security (Optional but Recommended)

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Enable RLS on user_tokens table
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read their own tokens
CREATE POLICY "Users can view own tokens" ON user_tokens
  FOR SELECT USING (auth.uid()::text = user_id::text);
```

## 🔐 Authentication Features

### What's Implemented:

1. **Custom Registration** (`/src/register`)
   - Full name, email, password (SHA-256 hashed)
   - Optional: gender, age
   - Role assignment (EDITOR by default)
   - Automatic login after registration

2. **Custom Login** (`/src/login`)
   - Email and password authentication
   - Token generation (24-hour expiration)
   - Device info tracking
   - Session management

3. **Protected Dashboard** (`/src/dashboard`)
   - User profile display
   - Role-based UI
   - Logout functionality
   - Stats overview

4. **Auth Context Features**:
   - `register(fullName, email, password, gender, age, role)`
   - `login(email, password)`
   - `logout()`
   - `updateUserProfile(updates)`
   - `changePassword(oldPassword, newPassword)`
   - `user` - Current user object
   - `token` - Auth token
   - `isAuthenticated` - Boolean
   - `loading` - Loading state

## 📱 How to Use

### Registration Flow:
```javascript
import { useAuth } from '../utils/auth_context';

const { register } = useAuth();

await register(
  'John Doe',           // fullName
  'john@example.com',   // email
  'password123',        // password
  'Male',              // gender (optional)
  25                   // age (optional)
);
```

### Login Flow:
```javascript
const { login } = useAuth();

await login('john@example.com', 'password123');
```

### Access User Data:
```javascript
const { user, isAuthenticated } = useAuth();

if (isAuthenticated) {
  console.log(user.full_name);
  console.log(user.email);
  console.log(user.role); // 'ADMIN' or 'EDITOR'
}
```

### Logout:
```javascript
const { logout } = useAuth();

await logout();
```

## 🔒 Security Features

1. **Password Hashing**: SHA-256 encryption
2. **Token Management**: Secure random tokens
3. **Session Tracking**: Device info and login/logout times
4. **Token Expiration**: 24-hour automatic expiration
5. **Secure Storage**: LocalStorage with validation

## 🎨 UI Components

All pages use the professional blue and white theme:
- **Login Page**: `/src/login`
- **Register Page**: `/src/register`
- **Dashboard**: `/src/dashboard`

## 📝 Database Schema

### Users Table:
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique, required
- `password` (VARCHAR) - SHA-256 hashed
- `full_name` (VARCHAR) - Required
- `gender` (VARCHAR) - Optional
- `age` (INTEGER) - Optional, 1-150
- `role` (VARCHAR) - 'ADMIN' or 'EDITOR'
- `created_at` (TIMESTAMP) - Auto-generated

### User Tokens Table:
- `uuid` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `token` (TEXT) - Unique auth token
- `expired_at` (TIMESTAMP) - Token expiration
- `login_time` (TIMESTAMP) - Login timestamp
- `logout_time` (TIMESTAMP) - Logout timestamp (null = active)
- `device_info` (JSONB) - Browser/device details

## 🚀 Next Steps

1. Run the SQL commands in Supabase
2. Install dependencies: `npm install @supabase/supabase-js`
3. Start your app: `npm run dev`
4. Test registration at `/src/register`
5. Test login at `/src/login`
6. Access dashboard at `/src/dashboard`

## 🎉 You're All Set!

Your authentication system is now fully functional with:
- ✅ Custom user registration
- ✅ Secure login with SHA-256
- ✅ Token-based session management
- ✅ Protected routes
- ✅ User dashboard
- ✅ Profile management
- ✅ Device tracking
