# Yacht Delivery Platform

A professional yacht delivery management system for coordinating yacht deliveries, managing fleet, and tracking captains.

## Features

- **Yacht Management**: Add, view, and manage yacht information
- **Captain Management**: Track captain credentials, experience, and specializations
- **Delivery Tracking**: Schedule and monitor yacht deliveries with status updates
- **Dashboard**: Overview of all deliveries, yachts, and captains
- **RESTful API**: Complete API for programmatic access

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data Storage**: In-memory (for demonstration)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Onshore-Cellars/delivery.git
cd delivery
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Yachts

- `GET /api/yachts` - Get all yachts
- `GET /api/yachts/:id` - Get a specific yacht
- `POST /api/yachts` - Create a new yacht
- `PUT /api/yachts/:id` - Update a yacht
- `DELETE /api/yachts/:id` - Delete a yacht

**Yacht Object:**
```json
{
  "id": 1,
  "name": "Sea Breeze",
  "type": "sailboat",
  "length": 45,
  "owner": "John Smith",
  "homePort": "Miami"
}
```

#### Captains

- `GET /api/captains` - Get all captains
- `GET /api/captains/:id` - Get a specific captain
- `POST /api/captains` - Create a new captain
- `PUT /api/captains/:id` - Update a captain
- `DELETE /api/captains/:id` - Delete a captain

**Captain Object:**
```json
{
  "id": 1,
  "name": "Captain Jack Morrison",
  "license": "CPT-12345",
  "experience": 15,
  "specializations": ["sailboat", "motor yacht"]
}
```

#### Deliveries

- `GET /api/deliveries` - Get all deliveries
- `GET /api/deliveries?status=scheduled` - Get deliveries by status
- `GET /api/deliveries/:id` - Get a specific delivery
- `POST /api/deliveries` - Create a new delivery
- `PUT /api/deliveries/:id` - Update a delivery
- `DELETE /api/deliveries/:id` - Delete a delivery

**Delivery Object:**
```json
{
  "id": 1,
  "yachtId": 1,
  "captainId": 1,
  "origin": "Miami, FL",
  "destination": "Nassau, Bahamas",
  "departureDate": "2025-11-01",
  "estimatedArrival": "2025-11-03",
  "status": "scheduled"
}
```

**Status Values:**
- `scheduled` - Delivery is planned
- `in-progress` - Delivery is underway
- `completed` - Delivery is finished
- `cancelled` - Delivery was cancelled

## Usage Examples

### Create a New Yacht
```bash
curl -X POST http://localhost:3000/api/yachts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ocean Dream",
    "type": "motor yacht",
    "length": 65,
    "owner": "Sarah Johnson",
    "homePort": "Fort Lauderdale"
  }'
```

### Schedule a Delivery
```bash
curl -X POST http://localhost:3000/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "yachtId": 1,
    "captainId": 1,
    "origin": "Miami, FL",
    "destination": "Key West, FL",
    "departureDate": "2025-11-15",
    "estimatedArrival": "2025-11-16",
    "status": "scheduled"
  }'
```

### Update Delivery Status
```bash
curl -X PUT http://localhost:3000/api/deliveries/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress"
  }'
```

## Testing

Run the test suite:
```bash
npm test
```

Note: The server must be running on port 3000 for tests to pass.

## Project Structure

```
delivery/
├── src/
│   ├── models/           # Data models
│   │   ├── Yacht.js
│   │   ├── Captain.js
│   │   └── Delivery.js
│   ├── controllers/      # Business logic
│   │   ├── YachtController.js
│   │   ├── CaptainController.js
│   │   └── DeliveryController.js
│   ├── routes/          # API routes
│   │   ├── yachts.js
│   │   ├── captains.js
│   │   └── deliveries.js
│   └── server.js        # Express server
├── public/              # Frontend files
│   └── index.html
├── tests/               # Test files
│   └── api.test.js
├── package.json
└── README.md
```

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Real-time tracking with GPS
- Weather integration
- Email notifications
- Mobile app
- Advanced analytics and reporting

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
