# eventos-mcp Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-07

## Active Technologies
- TypeScript 5.x / Node.js 20+ (001-eventos-mcp-model)
- @modelcontextprotocol/sdk (MCP protocol implementation)
- axios (HTTP client for API calls)
- dotenv (Environment configuration)
- Jest (Testing framework)

## Project Structure
```
src/
├── models/
│   ├── eventos-types.ts    # eventos API types
│   └── mcp-types.ts        # MCP protocol types
├── services/
│   ├── auth.ts             # Authentication service
│   ├── events.ts           # Event management service
│   ├── accounts.ts         # Account management service
│   └── tickets.ts          # Ticket management service
├── cli/
│   └── server.ts           # MCP server entry point
└── lib/
    ├── api-client.ts       # eventos API client
    └── error-handler.ts    # Error handling utilities

tests/
├── contract/
│   └── eventos-api.test.ts # API contract tests
├── integration/
│   └── mcp-tools.test.ts  # MCP tool integration tests
└── unit/
    └── services.test.ts   # Service unit tests
```

## Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run build:watch  # Build in watch mode
```

### Testing
```bash
npm test                # Run all tests
npm run test:contract   # Run contract tests
npm run test:integration # Run integration tests
npm run test:unit       # Run unit tests
npm run test:performance # Run performance tests
```

### MCP Server
```bash
npm start            # Start MCP server
npm run cli -- authenticate  # Test authentication
npm run cli -- list-accounts # List accounts
npm run cli -- list-tickets  # List tickets
```

## Code Style
- TypeScript: Follow standard conventions with strict mode
- Use async/await for all asynchronous operations
- Implement proper error handling with typed errors
- Document all MCP tools with clear descriptions
- Use Zod for runtime type validation

## API Endpoints

### eventos API Base URL
```
https://public-api.eventos.tokyo
```

### Authentication
- POST /token - Get access token (OAuth2 client credentials)

### Account Management
- GET /accounts - List accounts
- POST /accounts - Create account
- GET /accounts/{id} - Get account details
- PUT /accounts/{id} - Update account
- DELETE /accounts/{id} - Delete account

### Ticket Management
- GET /tickets - List tickets
- POST /tickets - Create ticket
- GET /tickets/{id} - Get ticket details
- PUT /tickets/{id} - Update ticket
- DELETE /tickets/{id} - Delete ticket

## MCP Tools Available

### Authentication
- `eventos_authenticate` - Get access token

### Account Management
- `eventos_list_accounts` - List all accounts with pagination
- `eventos_get_account` - Get specific account details
- `eventos_create_account` - Create new account
- `eventos_update_account` - Update existing account
- `eventos_delete_account` - Delete account

### Ticket Management
- `eventos_list_tickets` - List all tickets with filters
- `eventos_get_ticket` - Get specific ticket details
- `eventos_create_ticket` - Create new ticket type
- `eventos_update_ticket` - Update ticket information
- `eventos_delete_ticket` - Delete ticket

## Environment Configuration

Required environment variables:
```env
EVENTOS_CLIENT_ID=your_client_id
EVENTOS_CLIENT_SECRET=your_client_secret
EVENTOS_API_URL=https://public-api.eventos.tokyo
```

## Testing Strategy

1. **Contract Tests First**: Validate API contracts before implementation
2. **Integration Tests**: Test MCP tool chains with real API
3. **Unit Tests**: Test individual services and utilities
4. **Performance Tests**: Ensure <500ms response time

## Error Handling

- Map HTTP status codes to MCP error responses
- Implement exponential backoff for rate limiting
- Provide detailed error context in responses
- Log all errors for debugging

## Recent Changes
- 001-eventos-mcp-model: Initial MCP server setup with TypeScript
- Added authentication service with token refresh
- Implemented account and ticket management tools
- Created comprehensive test suite

<!-- MANUAL ADDITIONS START -->
<!-- Add any manual project-specific guidelines here -->
<!-- MANUAL ADDITIONS END -->