# Quickstart: eventos MCP Server

## Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- eventos API credentials (client_id, client_secret)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd eventos-mcp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your eventos API credentials
```

## Configuration

Create a `.env` file with your credentials:

```env
EVENTOS_CLIENT_ID=your_client_id
EVENTOS_CLIENT_SECRET=your_client_secret
EVENTOS_API_URL=https://public-api.eventos.tokyo
```

## Running the MCP Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Testing the Integration

### 1. Verify Authentication

```bash
# Test authentication tool
npm run test:auth
```

Expected output:
```
✓ Authentication successful
✓ Token stored and valid for 3600 seconds
```

### 2. Test Account Operations

```bash
# Create a test account
npm run test:account:create

# List accounts
npm run test:account:list

# Update account
npm run test:account:update

# Delete account
npm run test:account:delete
```

### 3. Test Ticket Operations

```bash
# Create a test ticket
npm run test:ticket:create

# List tickets
npm run test:ticket:list

# Update ticket
npm run test:ticket:update

# Delete ticket
npm run test:ticket:delete
```

## Using with Claude Desktop

1. Add the server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "eventos": {
      "command": "node",
      "args": ["/path/to/eventos-mcp/dist/cli/server.js"],
      "env": {
        "EVENTOS_CLIENT_ID": "your_client_id",
        "EVENTOS_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. Test the integration:
   - "List all active events"
   - "Create a new event for next Friday"
   - "Show me ticket sales for event ID 123"

## Available MCP Tools

### Authentication
- `eventos_authenticate` - Get access token

### Account Management
- `eventos_list_accounts` - List all accounts
- `eventos_get_account` - Get account details
- `eventos_create_account` - Create new account
- `eventos_update_account` - Update account
- `eventos_delete_account` - Delete account

### Ticket Management
- `eventos_list_tickets` - List all tickets
- `eventos_get_ticket` - Get ticket details
- `eventos_create_ticket` - Create new ticket
- `eventos_update_ticket` - Update ticket
- `eventos_delete_ticket` - Delete ticket

## Example Usage

### Create an Event Account

```typescript
// Tool: eventos_create_account
{
  "email": "organizer@example.com",
  "name": "Event Organizer",
  "role": "organizer",
  "organization": "Example Events Inc"
}
```

### Create Event Tickets

```typescript
// Tool: eventos_create_ticket
{
  "eventId": "evt_123",
  "type": "general",
  "name": "General Admission",
  "price": 50.00,
  "currency": "USD",
  "quantity": 100
}
```

### Query Ticket Availability

```typescript
// Tool: eventos_list_tickets
{
  "eventId": "evt_123",
  "status": "active"
}
```

## Troubleshooting

### Authentication Failed

- Check your client_id and client_secret in .env
- Ensure the API URL is correct
- Verify your credentials are active

### Connection Timeout

- Check network connectivity
- Verify the API endpoint is accessible
- Check firewall settings

### Rate Limiting

- The server implements exponential backoff
- Default retry: 3 attempts
- Wait time doubles on each retry

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run contract tests
npm run test:contract

# Run integration tests
npm run test:integration

# Run unit tests
npm run test:unit
```

### Building

```bash
# Build TypeScript
npm run build

# Watch mode
npm run build:watch
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

## Performance Validation

Run the performance test suite:

```bash
npm run test:performance
```

Expected results:
- Average response time: <500ms
- Token refresh: Automatic
- Concurrent requests: Supported
- Rate limiting: Handled gracefully

## Next Steps

1. Configure your production credentials
2. Set up monitoring and logging
3. Customize tool parameters as needed
4. Integrate with your AI workflow

## Support

For issues or questions:
- Check the [documentation](./data-model.md)
- Review [API contracts](./contracts/eventos-api.yaml)
- File an issue in the repository

---

## Quick Test Script

Save this as `test-mcp.sh`:

```bash
#!/bin/bash

echo "Testing eventos MCP Server..."

# Test authentication
echo "1. Testing authentication..."
npm run cli -- authenticate

# Test account listing
echo "2. Testing account listing..."
npm run cli -- list-accounts --limit 5

# Test ticket listing
echo "3. Testing ticket listing..."
npm run cli -- list-tickets --limit 5

echo "All tests completed!"
```

Run with: `chmod +x test-mcp.sh && ./test-mcp.sh`