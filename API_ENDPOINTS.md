# Troy BBQ Catering API Endpoints

This document outlines the API endpoints created for Phase 3 of the Troy BBQ project - Catering Quote Management.

## Quote Management API

### `/api/catering/quotes`

#### GET - Fetch Quotes
- **URL**: `GET /api/catering/quotes`
- **Query Parameters**:
  - `id` (string, optional): Fetch specific quote by ID
  - `email` (string, optional): Fetch all quotes for a customer email
  - `limit` (number, optional, default: 50): Pagination limit
  - `offset` (number, optional, default: 0): Pagination offset

**Examples**:
```bash
# Get all quotes (paginated)
GET /api/catering/quotes?limit=10&offset=0

# Get quotes by customer email
GET /api/catering/quotes?email=customer@example.com

# Get specific quote
GET /api/catering/quotes?id=550e8400-e29b-41d4-a716-446655440000
```

#### POST - Create Quote
- **URL**: `POST /api/catering/quotes`
- **Body**: JSON object with quote data
- **Validation**: Uses `createQuoteSchema` with Zod validation

**Request Body Structure**:
```json
{
  "customerEmail": "customer@example.com",
  "eventDetails": {
    "type": "corporate",
    "date": "2024-12-15T18:00:00Z",
    "guestCount": 50,
    "hungerLevel": "prettyHungry",
    "location": {
      "address": "123 Main St, Austin, TX 78701",
      "distanceMiles": 12.5
    }
  },
  "menuSelections": [
    {
      "proteinId": "550e8400-e29b-41d4-a716-446655440001",
      "sideId": "550e8400-e29b-41d4-a716-446655440002",
      "quantity": 25
    }
  ],
  "addOns": [
    {
      "addOnId": "550e8400-e29b-41d4-a716-446655440003",
      "quantity": 2
    }
  ],
  "pricing": {
    "subtotalCents": 125000,
    "taxCents": 10000,
    "deliveryFeeCents": 5000,
    "totalCents": 140000,
    "depositCents": 42000,
    "balanceCents": 98000
  },
  "status": "pending"
}
```

#### PUT - Update Quote Status
- **URL**: `PUT /api/catering/quotes?id={quoteId}`
- **Body**: JSON object with status update
- **Validation**: Uses `updateQuoteStatusSchema`

**Request Body Structure**:
```json
{
  "status": "approved",
  "medusaOrderId": "order_01234567890",
  "balanceOrderId": "order_09876543210"
}
```

## Add-ons Management API

### `/api/catering/addons`

#### GET - Fetch Add-ons
- **URL**: `GET /api/catering/addons`
- **Query Parameters**:
  - `active` (boolean, optional, default: true): Filter by active status
  - `category` (string, optional): Filter by category
  - `id` (string, optional): Fetch specific add-on by ID

**Examples**:
```bash
# Get all active add-ons
GET /api/catering/addons

# Get all add-ons including inactive
GET /api/catering/addons?active=false

# Get add-ons by category
GET /api/catering/addons?category=service

# Get specific add-on
GET /api/catering/addons?id=550e8400-e29b-41d4-a716-446655440000
```

#### POST - Create Add-on
- **URL**: `POST /api/catering/addons`
- **Body**: JSON object with add-on data
- **Validation**: Uses `createAddonSchema`

**Request Body Structure**:
```json
{
  "name": "Premium Setup Service",
  "description": "Full service setup and breakdown with premium equipment",
  "priceCents": 25000,
  "isActive": true,
  "category": "service"
}
```

#### PUT - Update Add-on
- **URL**: `PUT /api/catering/addons?id={addonId}`
- **Body**: JSON object with fields to update
- **Validation**: Uses `updateAddonSchema`

**Request Body Structure**:
```json
{
  "name": "Updated Premium Setup Service",
  "priceCents": 30000,
  "isActive": true
}
```

#### DELETE - Delete Add-on
- **URL**: `DELETE /api/catering/addons?id={addonId}`
- **Body**: None

## Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [ /* Optional validation errors */ ]
}
```

## Status Codes

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Database Integration

All endpoints use the `DatabaseService` class from `/src/lib/database.ts` which provides:

- **Quote Management**: `createCateringQuote()`, `getCateringQuote()`, `updateCateringQuoteStatus()`, `getCateringQuotesByEmail()`, `getAllCateringQuotes()`
- **Add-on Management**: `getCateringAddons()`, `createCateringAddon()`, `updateCateringAddon()`, `deleteCateringAddon()`

## Validation Schemas

All endpoints use Zod schemas for validation:

- **Quote Creation**: `createQuoteSchema` - validates all required fields for new quotes
- **Quote Status Update**: `updateQuoteStatusSchema` - validates status changes and order IDs
- **Add-on Creation**: `createAddonSchema` - validates new add-on data
- **Add-on Update**: `updateAddonSchema` - validates partial updates to add-ons

## Error Handling

All endpoints include comprehensive error handling:

- Input validation with detailed error messages
- Database error catching and logging
- Proper HTTP status codes
- Consistent error response format
- Existence checks for update/delete operations

## Security Considerations

- All inputs are validated using Zod schemas
- Database queries use parameterized statements
- Error messages don't expose sensitive information
- Proper Content-Type headers are set

## Next Steps

These API endpoints support the core functionality needed for:

1. **Multi-step quote builder form** - POST `/api/catering/quotes`
2. **Dynamic pricing calculation** - Integration with quote creation
3. **Quote management dashboard** - GET endpoints with filtering
4. **Two-phase payment workflow** - Status updates with order IDs
5. **Add-on services management** - Full CRUD operations

The endpoints are ready for integration with the frontend components and MedusaJS payment processing.