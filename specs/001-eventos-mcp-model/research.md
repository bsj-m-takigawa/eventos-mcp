# Research: eventos MCP Integration

## Authentication Research

### Decision: Bearer Token Authentication
**Rationale**: eventos API uses OAuth2-style token authentication via `/token` endpoint
**Alternatives considered**: 
- API Key: Not supported by eventos
- Basic Auth: Less secure, not offered

### Implementation Details:
- Endpoint: `https://public-api.eventos.tokyo/token`
- Method: POST
- Required credentials: client_id, client_secret, grant_type
- Returns: access_token, refresh_token, expires_in
- Token usage: Bearer token in Authorization header

## MCP SDK Best Practices

### Decision: Direct SDK Integration
**Rationale**: MCP SDK provides standardized protocol implementation
**Key Patterns**:
- Tool registration with typed parameters
- Structured error responses
- Async/await for all operations
- Resource management for API connections

### TypeScript Implementation:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

## eventos API Structure

### Endpoints Discovered:
1. **Authentication**
   - POST /token - Get access token
   
2. **Account Management**
   - GET /accounts - List accounts
   - POST /accounts - Create account
   - GET /accounts/{id} - Get account details
   - PUT /accounts/{id} - Update account
   - DELETE /accounts/{id} - Delete account

3. **Ticket Management**
   - GET /tickets - List tickets
   - POST /tickets - Create ticket
   - GET /tickets/{id} - Get ticket details
   - PUT /tickets/{id} - Update ticket
   - DELETE /tickets/{id} - Delete ticket

### Response Format:
- Standard JSON responses
- Pagination: limit/offset parameters
- Error format: `{ error: string, code: number }`
- Success format: `{ data: T, meta?: object }`

## Error Handling Patterns

### Decision: Structured MCP Error Responses
**Rationale**: Consistent error handling across all tools
**Implementation**:
- Map HTTP status codes to MCP error codes
- Include original error message
- Add context about the operation
- Log errors for debugging

### Error Mapping:
- 401 → Authentication error
- 403 → Permission denied
- 404 → Resource not found
- 429 → Rate limit exceeded
- 500+ → Server error

## Rate Limiting Strategy

### Decision: Exponential Backoff
**Rationale**: Respect API limits while maintaining reliability
**Implementation**:
- Initial retry after 1 second
- Double wait time on each retry
- Maximum 3 retries
- Include rate limit headers in responses

## Data Model Mapping

### eventos Entities → MCP Types:
1. **Event**
   - Required: title, date, venue
   - Optional: description, capacity, status
   
2. **Account**
   - Required: email, name
   - Optional: phone, organization, role
   
3. **Ticket**
   - Required: eventId, type, price
   - Optional: quantity, validFrom, validUntil

## Security Considerations

### Decision: Environment Variable Storage
**Rationale**: Secure credential management
**Implementation**:
- Store credentials in .env file
- Never commit credentials
- Validate environment on startup
- Mask sensitive data in logs

## Performance Optimizations

### Decision: Connection Pooling
**Rationale**: Reduce latency for API calls
**Strategies**:
- Reuse HTTP connections
- Cache authentication tokens
- Batch operations where possible
- Implement request deduplication

## Testing Strategy

### Decision: Mock Server for Development
**Rationale**: Test without hitting production API
**Approach**:
- Use MSW for API mocking
- Record real API responses
- Test error scenarios
- Validate request/response schemas

## Dependencies Selected

### Core Dependencies:
```json
{
  "@modelcontextprotocol/sdk": "^0.5.0",
  "axios": "^1.6.0",
  "dotenv": "^16.3.0",
  "zod": "^3.22.0"
}
```

### Dev Dependencies:
```json
{
  "@types/node": "^20.0.0",
  "typescript": "^5.3.0",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.0",
  "msw": "^2.0.0"
}
```

## Implementation Order

1. **Phase 1**: Core infrastructure
   - API client with authentication
   - Error handling utilities
   - Type definitions

2. **Phase 2**: MCP Tools
   - Authentication tool
   - Account management tools
   - Ticket management tools

3. **Phase 3**: Server setup
   - MCP server initialization
   - Tool registration
   - Configuration management

## Open Questions Resolved

1. **Q**: How to handle token refresh?
   **A**: Automatic refresh when token expires, store refresh token securely

2. **Q**: Rate limiting approach?
   **A**: Exponential backoff with configurable retry limits

3. **Q**: Multi-tenant support?
   **A**: Use environment variables for organization-specific endpoints

4. **Q**: Caching strategy?
   **A**: In-memory cache for tokens only, no data caching (stateless)

---

## Summary

All technical unknowns have been researched and resolved. The eventos MCP integration will use:
- Bearer token authentication with automatic refresh
- TypeScript with MCP SDK for type safety
- Structured error handling with proper MCP responses
- Environment-based configuration for security
- TDD approach with contract-first testing

Ready to proceed with Phase 1: Design & Contracts