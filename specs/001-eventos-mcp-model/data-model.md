# Data Model: eventos MCP Integration

## Core Entities

### 1. Authentication

#### Token
```typescript
interface Token {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
  scope?: string;
}
```

**Validation Rules:**
- accessToken: Required, non-empty string
- expiresIn: Positive integer (seconds)
- tokenType: Always 'Bearer'

**State Transitions:**
- Active → Expired (after expiresIn seconds)
- Expired → Active (via refresh token)

### 2. Account Management

#### Account
```typescript
interface Account {
  id: string;
  email: string;
  name: string;
  phone?: string;
  organization?: string;
  role?: 'admin' | 'organizer' | 'attendee';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'suspended';
}
```

**Validation Rules:**
- email: Valid email format (RFC 5322)
- name: 1-100 characters
- phone: E.164 format if provided
- status: Must be one of defined values

**State Transitions:**
- active → inactive (soft delete)
- active → suspended (admin action)
- inactive → active (reactivation)
- suspended → active (admin action)

### 3. Event Management

#### Event
```typescript
interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
  venue: Venue;
  capacity?: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  organizerId: string;
  tags?: string[];
  registrationOpen: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Validation Rules:**
- title: 1-200 characters
- startDate: Must be future date for new events
- endDate: Must be after startDate
- capacity: Positive integer if provided
- status: Must be one of defined values

**State Transitions:**
- draft → published (publish event)
- published → cancelled (cancel event)
- published → completed (after endDate)
- draft → cancelled (abandon draft)

#### Venue
```typescript
interface Venue {
  id?: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  capacity?: number;
  amenities?: string[];
}
```

**Validation Rules:**
- name: 1-100 characters
- address: 1-200 characters
- city: 1-50 characters
- country: ISO 3166-1 alpha-2 code

### 4. Ticket Management

#### Ticket
```typescript
interface Ticket {
  id: string;
  eventId: string;
  type: 'general' | 'vip' | 'early-bird' | 'group';
  name: string;
  description?: string;
  price: number;
  currency: string;  // ISO 4217
  quantity: number;
  available: number;
  validFrom?: string;  // ISO 8601
  validUntil?: string; // ISO 8601
  status: 'active' | 'sold-out' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

**Validation Rules:**
- price: Non-negative number (0 for free tickets)
- currency: Valid ISO 4217 code
- quantity: Positive integer
- available: 0 to quantity
- validUntil: Must be after validFrom if both provided

**State Transitions:**
- active → sold-out (when available = 0)
- sold-out → active (when tickets released)
- active → cancelled (cancel ticket type)

#### Registration
```typescript
interface Registration {
  id: string;
  ticketId: string;
  accountId: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  confirmationCode: string;
  registeredAt: string;
  attendedAt?: string;
}
```

**Validation Rules:**
- quantity: Positive integer
- totalPrice: Non-negative number
- confirmationCode: Unique 8-character alphanumeric
- status: Must be one of defined values

**State Transitions:**
- pending → confirmed (payment completed)
- pending → cancelled (timeout or user action)
- confirmed → cancelled (before event)
- confirmed → attended (check-in at event)

### 5. Analytics

#### EventAnalytics
```typescript
interface EventAnalytics {
  eventId: string;
  totalRegistrations: number;
  totalAttendees: number;
  totalRevenue: number;
  averageRating?: number;
  ticketsSold: {
    [ticketType: string]: number;
  };
  attendanceRate: number;  // percentage
  demographics?: {
    ageGroups?: Record<string, number>;
    locations?: Record<string, number>;
  };
}
```

**Validation Rules:**
- totalRegistrations: Non-negative integer
- totalAttendees: 0 to totalRegistrations
- totalRevenue: Non-negative number
- attendanceRate: 0 to 100
- averageRating: 1 to 5 if provided

## MCP Protocol Types

### Tool Request
```typescript
interface MCPToolRequest {
  tool: string;
  arguments: Record<string, any>;
}
```

### Tool Response
```typescript
interface MCPToolResponse<T = any> {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: T;
  }>;
}
```

### Error Response
```typescript
interface MCPError {
  code: number;
  message: string;
  details?: Record<string, any>;
}
```

## Relationships

### Entity Relationships
```
Account ──┐
          ├─► Registration ──► Ticket ──► Event
          └─► Event (as organizer)
          
Event ──► Venue
      ──► EventAnalytics
      
Ticket ──► Event
       ──► Registration ──► Account
```

### Cardinality
- Account : Registration = 1 : N
- Account : Event (organizer) = 1 : N
- Event : Ticket = 1 : N
- Event : Venue = N : 1
- Event : EventAnalytics = 1 : 1
- Ticket : Registration = 1 : N
- Registration : Account = N : 1

## Data Constraints

### Business Rules
1. **Event Capacity**: Sum of all ticket quantities cannot exceed event capacity
2. **Ticket Availability**: Available tickets cannot exceed total quantity
3. **Registration Limit**: User cannot register for same event multiple times with same ticket type
4. **Price Consistency**: Registration total must equal ticket price × quantity
5. **Date Validation**: Cannot register for past events
6. **Cancellation Policy**: Cannot cancel registration within 24 hours of event

### Integrity Constraints
1. **Referential Integrity**: All foreign keys must reference existing records
2. **Unique Constraints**: 
   - Account email must be unique
   - Event title + date combination should be unique
   - Registration confirmation code must be unique
3. **Check Constraints**:
   - Dates must be valid ISO 8601
   - Prices must be non-negative
   - Quantities must be positive

## Data Access Patterns

### Common Queries
1. **List Events**: Filter by date range, status, location
2. **Get Event Details**: Include venue, tickets, analytics
3. **List Registrations**: By account, by event, by status
4. **Check Availability**: Real-time ticket availability
5. **Generate Analytics**: Aggregate registration and attendance data

### Performance Considerations
- Index on: event dates, account email, registration status
- Cache: Token data, event listings (5 min TTL)
- Pagination: Default 20 items, max 100
- Batch operations: Support bulk registration updates

---

## Summary

The data model defines 8 core entities with clear validation rules, state transitions, and relationships. All entities map directly to eventos API resources and MCP tool operations, ensuring type safety and data consistency throughout the system.