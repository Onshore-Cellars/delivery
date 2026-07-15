# Onshore Delivery — Integration API

B2B API for companies to automatically create delivery listings from their sales orders.

## Authentication

All integration endpoints use **API key** authentication.

```
Authorization: Bearer od_live_abc123...
```

### Generating an API Key

Logged-in users generate keys via `POST /api/integrations/keys`:

```bash
curl -X POST https://your-domain.com/api/integrations/keys \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Onshore Cellars Production" }'
```

**Response (201):**
```json
{
  "id": "clxyz...",
  "name": "Onshore Cellars Production",
  "key": "od_live_a1b2c3d4e5f6...",
  "prefix": "od_live_a1b2",
  "scopes": ["orders:write", "orders:read"],
  "expiresAt": null,
  "warning": "Save this key now — it cannot be retrieved again."
}
```

> **Important:** The raw key is only returned once at creation. Store it securely.

### Managing Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/integrations/keys` | Create a new API key |
| `GET` | `/api/integrations/keys` | List your keys (prefix only) |
| `DELETE` | `/api/integrations/keys?id=<keyId>` | Revoke a key |

**Create key options:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | **required** | Label for this key (max 100 chars) |
| `scopes` | string[] | `["orders:write","orders:read"]` | Permission scopes |
| `expiresInDays` | number | `null` (never) | Auto-expire after N days |

Maximum 5 active keys per account.

---

## Create Order → Listing

`POST /api/integrations/orders`

Submits a sales order and automatically creates a `SPACE_NEEDED` delivery listing on the marketplace.

### Request

```bash
curl -X POST https://your-domain.com/api/integrations/orders \
  -H "Authorization: Bearer od_live_a1b2c3d4e5f6..." \
  -H "Content-Type: application/json" \
  -d '{
    "orderReference": "OC-2026-001234",
    "customerName": "Marina Porto Cervo",
    "customerEmail": "supplies@portocervo.it",
    "customerPhone": "+39 0789 91234",
    "deliveryAddress": "Via della Marina 12, Porto Cervo, Sardinia",
    "deliveryCity": "Porto Cervo",
    "deliveryCountry": "IT",
    "deliveryLat": 41.1333,
    "deliveryLng": 9.5333,
    "deliveryNotes": "Dock C, berth 14. Ask for captain.",
    "cargoDescription": "12 cases premium wine, temperature sensitive",
    "cargoWeightKg": 180,
    "cargoVolumeM3": 0.6,
    "cargoValue": 4800,
    "cargoCurrency": "EUR",
    "preferredDate": "2026-04-15",
    "urgency": "standard",
    "originPort": "Southampton",
    "metadata": {
      "salesChannel": "website",
      "invoiceNumber": "INV-2026-5678"
    }
  }'
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `orderReference` | string | Your unique order/invoice number (idempotency key) |
| `customerName` | string | Recipient name |
| `deliveryAddress` | string | Full delivery address |
| `cargoDescription` | string | What's being shipped |
| `cargoWeightKg` | number | Total weight in kg (must be > 0) |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `customerEmail` | string | — | Recipient email |
| `customerPhone` | string | — | Recipient phone |
| `deliveryCity` | string | — | City (used as destination port name) |
| `deliveryCountry` | string | — | ISO country code |
| `deliveryLat` | number | — | Latitude for location matching |
| `deliveryLng` | number | — | Longitude for location matching |
| `deliveryNotes` | string | — | Special instructions for driver |
| `cargoVolumeM3` | number | `1` | Volume in cubic metres |
| `cargoValue` | number | — | Declared value for insurance |
| `cargoCurrency` | string | `EUR` | Currency code |
| `preferredDate` | string | today | ISO date (YYYY-MM-DD) |
| `urgency` | string | `standard` | `standard`, `express`, or `flexible` |
| `originPort` | string | company name | Override pickup location |
| `metadata` | object | — | Freeform JSON for your own reference |

### Response (201 Created)

```json
{
  "order": {
    "id": "clxyz...",
    "orderReference": "OC-2026-001234",
    "status": "listed",
    "customerName": "Marina Porto Cervo",
    "cargoDescription": "12 cases premium wine, temperature sensitive",
    "cargoWeightKg": 180,
    "createdAt": "2026-03-21T14:30:00.000Z"
  },
  "listing": {
    "id": "clxyz...",
    "title": "Delivery: OC-2026-001234 — Marina Porto Cervo",
    "status": "ACTIVE",
    "originPort": "Southampton",
    "destinationPort": "Porto Cervo",
    "departureDate": "2026-04-15T00:00:00.000Z"
  },
  "message": "Order created and listed successfully"
}
```

### Idempotency

If you send the same `orderReference` twice, the API returns the existing order with `"duplicate": true` and HTTP 200 (not 201). This makes it safe to retry on network failures.

### Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Missing required fields or invalid data |
| 401 | Invalid or missing API key |
| 403 | API key lacks `orders:write` scope |
| 500 | Internal server error |

---

## List Orders

`GET /api/integrations/orders`

Retrieve your submitted orders with pagination.

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | `1` | Page number |
| `limit` | int | `20` | Results per page (max 100) |
| `status` | string | — | Filter: `pending`, `listed`, `matched`, `in_transit`, `delivered`, `cancelled` |
| `orderReference` | string | — | Search by order reference (partial match) |

### Example

```bash
curl "https://your-domain.com/api/integrations/orders?status=listed&limit=10" \
  -H "Authorization: Bearer od_live_a1b2c3d4e5f6..."
```

### Response (200)

```json
{
  "orders": [
    {
      "id": "clxyz...",
      "orderReference": "OC-2026-001234",
      "status": "listed",
      "customerName": "Marina Porto Cervo",
      "deliveryAddress": "Via della Marina 12, Porto Cervo",
      "cargoWeightKg": 180,
      "listing": {
        "id": "clxyz...",
        "title": "Delivery: OC-2026-001234 — Marina Porto Cervo",
        "status": "ACTIVE",
        "originPort": "Southampton",
        "destinationPort": "Porto Cervo",
        "departureDate": "2026-04-15T00:00:00.000Z"
      },
      "createdAt": "2026-03-21T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

---

## Order Status Flow

```
pending → listed → matched → in_transit → delivered
                                       ↘ cancelled
```

| Status | Description |
|--------|-------------|
| `pending` | Order received, listing not yet created |
| `listed` | Listing is live on marketplace |
| `matched` | A carrier has accepted/booked the delivery |
| `in_transit` | Shipment is en route |
| `delivered` | Delivery confirmed |
| `cancelled` | Order cancelled |

---

## Rate Limits

API key requests are rate-limited to **60 requests per minute** per key. Standard platform rate limits apply.

## Webhooks (Coming Soon)

Webhook callbacks for order status changes (e.g. when a carrier accepts your listing). Contact us to register interest.
