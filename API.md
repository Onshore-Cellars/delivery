# API Documentation

This document describes all available API endpoints in the Yachting Logistics Marketplace.

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Get the token by logging in via `/api/auth/login`.

## Endpoints

### Authentication

#### Register User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "CARRIER",
  "phone": "+1234567890",
  "company": "ABC Logistics"
}
```

**Roles:** `CARRIER`, `SHIPPER`, `YACHT_CLIENT`, `ADMIN`

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CARRIER",
    "phone": "+1234567890",
    "company": "ABC Logistics",
    "createdAt": "2025-10-25T18:00:00.000Z"
  }
}
```

---

#### Login
**POST** `/api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CARRIER",
    "createdAt": "2025-10-25T18:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Van Listings

#### Get All Listings
**GET** `/api/listings`

Retrieve all active van listings with optional filters.

**Query Parameters:**
- `origin` (string): Filter by origin address
- `destination` (string): Filter by destination address
- `dateFrom` (ISO date): Filter by departure date (from)
- `dateTo` (ISO date): Filter by departure date (to)
- `minWeight` (number): Minimum available weight in kg
- `minVolume` (number): Minimum available volume in m³

**Example:**
```
GET /api/listings?origin=Monaco&destination=Saint-Tropez&minWeight=100
```

**Response:** `200 OK`
```json
{
  "listings": [
    {
      "id": "clx...",
      "vehicleType": "Mercedes Sprinter",
      "licensePlate": "AB-123-CD",
      "originAddress": "Monaco, Monte Carlo",
      "destinationAddress": "Saint-Tropez, France",
      "departureDate": "2025-11-01T08:00:00.000Z",
      "arrivalDate": "2025-11-01T10:00:00.000Z",
      "totalWeight": 1000,
      "totalVolume": 15,
      "availableWeight": 400,
      "availableVolume": 6,
      "pricePerKg": 2.5,
      "pricePerCubicMeter": 50,
      "fixedPrice": null,
      "isActive": true,
      "carrier": {
        "id": "clx...",
        "name": "John Doe",
        "company": "ABC Logistics",
        "email": "carrier@example.com",
        "phone": "+1234567890"
      }
    }
  ]
}
```

---

#### Create Listing
**POST** `/api/listings`

Create a new van listing. **Requires CARRIER role.**

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "vehicleType": "Mercedes Sprinter",
  "licensePlate": "AB-123-CD",
  "originAddress": "Monaco, Monte Carlo",
  "destinationAddress": "Saint-Tropez, France",
  "departureDate": "2025-11-01T08:00:00.000Z",
  "arrivalDate": "2025-11-01T10:00:00.000Z",
  "totalWeight": 1000,
  "totalVolume": 15,
  "availableWeight": 400,
  "availableVolume": 6,
  "pricePerKg": 2.5,
  "pricePerCubicMeter": 50,
  "fixedPrice": null
}
```

**Response:** `201 Created`
```json
{
  "message": "Listing created successfully",
  "listing": {
    "id": "clx...",
    "vehicleType": "Mercedes Sprinter",
    "originAddress": "Monaco, Monte Carlo",
    "destinationAddress": "Saint-Tropez, France",
    "departureDate": "2025-11-01T08:00:00.000Z",
    "availableWeight": 400,
    "availableVolume": 6,
    "pricePerKg": 2.5,
    "carrier": {
      "id": "clx...",
      "name": "John Doe",
      "company": "ABC Logistics"
    }
  }
}
```

---

### Bookings

#### Get User Bookings
**GET** `/api/bookings`

Retrieve all bookings for the authenticated user.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "clx...",
      "weightBooked": 100,
      "volumeBooked": 2,
      "itemDescription": "Yacht supplies and equipment",
      "pickupAddress": "Monaco Port",
      "deliveryAddress": "Saint-Tropez Marina",
      "totalPrice": 350,
      "status": "PENDING",
      "createdAt": "2025-10-25T18:00:00.000Z",
      "listing": {
        "id": "clx...",
        "originAddress": "Monaco, Monte Carlo",
        "destinationAddress": "Saint-Tropez, France",
        "departureDate": "2025-11-01T08:00:00.000Z",
        "carrier": {
          "name": "John Doe",
          "company": "ABC Logistics",
          "phone": "+1234567890"
        }
      }
    }
  ]
}
```

---

#### Create Booking
**POST** `/api/bookings`

Create a new booking. **Requires SHIPPER or YACHT_CLIENT role.**

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "listingId": "clx...",
  "weightBooked": 100,
  "volumeBooked": 2,
  "itemDescription": "Yacht supplies and equipment",
  "pickupAddress": "Monaco Port",
  "deliveryAddress": "Saint-Tropez Marina"
}
```

**Response:** `201 Created`
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "clx...",
    "weightBooked": 100,
    "volumeBooked": 2,
    "itemDescription": "Yacht supplies and equipment",
    "totalPrice": 350,
    "status": "PENDING",
    "listing": {
      "originAddress": "Monaco, Monte Carlo",
      "destinationAddress": "Saint-Tropez, France",
      "carrier": {
        "name": "John Doe",
        "company": "ABC Logistics"
      }
    }
  }
}
```

---

### Admin

#### Get All Users
**GET** `/api/admin/users`

Get all users in the system. **Requires ADMIN role.**

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CARRIER",
      "phone": "+1234567890",
      "company": "ABC Logistics",
      "createdAt": "2025-10-25T18:00:00.000Z",
      "_count": {
        "listings": 5,
        "bookings": 0
      }
    }
  ]
}
```

---

#### Get Platform Statistics
**GET** `/api/admin/stats`

Get platform-wide statistics. **Requires ADMIN role.**

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`
```json
{
  "stats": {
    "users": {
      "total": 150,
      "carriers": 45,
      "shippers": 80,
      "yachtClients": 24
    },
    "listings": {
      "total": 230,
      "active": 156
    },
    "bookings": {
      "total": 445,
      "pending": 23,
      "confirmed": 380
    },
    "revenue": {
      "total": 125000.50
    }
  },
  "recentBookings": [
    {
      "id": "clx...",
      "totalPrice": 350,
      "status": "CONFIRMED",
      "createdAt": "2025-10-25T18:00:00.000Z",
      "listing": {
        "originAddress": "Monaco",
        "destinationAddress": "Saint-Tropez",
        "carrier": {
          "name": "John Doe",
          "company": "ABC Logistics"
        }
      },
      "shipper": {
        "name": "Jane Smith",
        "company": "Maritime Supplies",
        "email": "jane@example.com"
      }
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Only carriers can create listings"
}
```

### 404 Not Found
```json
{
  "error": "Listing not found or inactive"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "An error occurred during registration"
}
```

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, there are no rate limits implemented. Consider adding rate limiting in production using middleware or a service like Upstash.

## Pagination

Currently, pagination is not implemented for listing endpoints. This should be added for production use when dealing with large datasets.

## Future Endpoints

Planned but not yet implemented:

- `PATCH /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `PATCH /api/bookings/:id` - Update booking status
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/webhooks/stripe` - Handle Stripe webhooks
- `GET /api/routes/calculate` - Calculate route distance and time
