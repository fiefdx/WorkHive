# WorkHive Backend API

## Overview
Node.js + Express backend API for WorkHive shared workspace application with MongoDB integration.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas)
- **ODM:** Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=3000
MONGODB_URI=mongodb://<url for mongodb>
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
```

### 3. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns JWT token)
- `POST /api/auth/logout` - User logout (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile (requires auth)
- `DELETE /api/users/:id` - Delete user account (requires auth)

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create property (owner only, requires auth)
- `PUT /api/properties/:id` - Update property (owner only, requires auth)
- `DELETE /api/properties/:id` - Delete property (owner only, requires auth)
- `GET /api/properties/my-properties` - Get owner's properties (requires auth)

### Workspaces
- `GET /api/workspaces` - Search/filter workspaces (with query params)
- `GET /api/workspaces/:id` - Get workspace details with owner info
- `POST /api/workspaces` - Create workspace (owner only, requires auth)
- `PUT /api/workspaces/:id` - Update workspace (owner only, requires auth)
- `DELETE /api/workspaces/:id` - Delete workspace (owner only, requires auth)
- `GET /api/workspaces/my-workspaces` - Get owner's workspaces (requires auth)

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Database Models

### User Model
- firstName, middleName, lastName
- email (unique)
- phone
- password (hashed with bcrypt)
- role: 'owner' | 'coworker'
- averageRating, ratingCount
- timestamps

### Property Model
- ownerId (ref: User)
- address
- neighborhood
- squareFeet
- hasParking
- hasPublicTransit
- photos (array)
- averageRating
- timestamps

### Workspace Model
- propertyId (ref: Property)
- type: 'meeting room' | 'private office' | 'desk'
- seatingCapacity
- smokingAllowed
- availabilityDate
- leaseTerm: 'day' | 'week' | 'month'
- price
- photos (array)
- averageRating, ratingCount
- timestamps

## Workspace Search Parameters

The `/api/workspaces` endpoint supports the following query parameters:
- `neighborhood` - Filter by neighborhood
- `minSquareFeet` / `maxSquareFeet` - Filter by property size
- `hasParking` - Filter by parking availability (true/false)
- `hasPublicTransit` - Filter by public transit (true/false)
- `minSeatingCapacity` - Minimum seating capacity
- `smokingAllowed` - Filter by smoking policy (true/false)
- `availabilityDate` - Filter by availability date
- `leaseTerm` - Filter by lease term (day/week/month)
- `minPrice` / `maxPrice` - Filter by price range
- `type` - Filter by workspace type
- `sortBy` - Sort field (default: createdAt)
- `order` - Sort order (asc/desc, default: desc)
- `limit` - Results per page (default: 50)
- `page` - Page number (default: 1)

## Project Structure
```
backend/
├── config/
│   └── database.js       # MongoDB connection
├── controllers/
│   ├── auth.js           # Authentication logic
│   ├── properties.js     # Property CRUD logic
│   ├── users.js          # User CRUD logic
│   └── workspaces.js     # Workspace CRUD logic
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── models/
│   ├── User.js           # User schema
│   ├── Property.js       # Property schema
│   └── Workspace.js      # Workspace schema
├── routes/
│   ├── auth.js           # Auth routes
│   ├── users.js          # User routes
│   ├── properties.js     # Property routes
│   └── workspaces.js     # Workspace routes
├── .env                  # Environment variables
├── package.json          # Dependencies
└── server.js             # Entry point
```

## Testing the API

You can test the API using tools like Postman, Thunder Client, or curl:

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "4165551234",
    "password": "password123",
    "role": "owner"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

1. **MongoDB Connection Error**
   - Verify MONGODB_URI in .env is correct
   - Check MongoDB Atlas network access settings
   - Ensure IP whitelist includes your IP

2. **Port Already in Use**
   - Change PORT in .env file
   - Or stop the process using port 3000

3. **JWT Token Expired**
   - Tokens expire after 7 days (configurable via JWT_EXPIRE)
   - Re-login to get a new token
