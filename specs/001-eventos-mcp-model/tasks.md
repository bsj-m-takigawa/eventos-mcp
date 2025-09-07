# Tasks: eventos MCP Integration

**Input**: Design documents from `/specs/001-eventos-mcp-model/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x, Node.js 20+, MCP SDK
   → Structure: Single project (src/, tests/)
2. Load optional design documents:
   → data-model.md: Token, Account, Event, Ticket entities
   → contracts/eventos-api.yaml: Authentication, Account, Ticket endpoints
   → research.md: Bearer token auth, MCP patterns
3. Generate tasks by category:
   → Setup: TypeScript init, MCP SDK, dependencies
   → Tests: Contract tests for API, integration tests
   → Core: Models, services, MCP tools
   → Integration: API client, error handling
   → Polish: Unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T036)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- All paths relative to repository root

## Phase 3.1: Setup
- [ ] T001 Create project structure per implementation plan (src/models, src/services, src/cli, src/lib, tests/)
- [ ] T002 Initialize TypeScript project with tsconfig.json and package.json
- [ ] T003 Install core dependencies (@modelcontextprotocol/sdk, axios, dotenv, zod)
- [ ] T004 Install dev dependencies (typescript, jest, @types/node, @types/jest, msw)
- [ ] T005 [P] Configure ESLint and Prettier for TypeScript
- [ ] T006 [P] Create .env.example with EVENTOS_CLIENT_ID, EVENTOS_CLIENT_SECRET, EVENTOS_API_URL
- [ ] T007 [P] Setup Jest configuration for TypeScript in jest.config.js

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T008 [P] Contract test POST /token authentication in tests/contract/auth.contract.test.ts
- [ ] T009 [P] Contract test GET /accounts in tests/contract/accounts-list.contract.test.ts
- [ ] T010 [P] Contract test POST /accounts in tests/contract/accounts-create.contract.test.ts
- [ ] T011 [P] Contract test GET /accounts/{id} in tests/contract/accounts-get.contract.test.ts
- [ ] T012 [P] Contract test PUT /accounts/{id} in tests/contract/accounts-update.contract.test.ts
- [ ] T013 [P] Contract test DELETE /accounts/{id} in tests/contract/accounts-delete.contract.test.ts
- [ ] T014 [P] Contract test GET /tickets in tests/contract/tickets-list.contract.test.ts
- [ ] T015 [P] Contract test POST /tickets in tests/contract/tickets-create.contract.test.ts
- [ ] T016 [P] Contract test GET /tickets/{id} in tests/contract/tickets-get.contract.test.ts
- [ ] T017 [P] Contract test PUT /tickets/{id} in tests/contract/tickets-update.contract.test.ts
- [ ] T018 [P] Contract test DELETE /tickets/{id} in tests/contract/tickets-delete.contract.test.ts

### Integration Tests
- [ ] T019 [P] Integration test MCP tool registration in tests/integration/mcp-server.test.ts
- [ ] T020 [P] Integration test authentication flow with token refresh in tests/integration/auth-flow.test.ts
- [ ] T021 [P] Integration test account CRUD operations via MCP tools in tests/integration/account-operations.test.ts
- [ ] T022 [P] Integration test ticket management via MCP tools in tests/integration/ticket-operations.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Models
- [ ] T023 [P] Token model with validation in src/models/eventos-types.ts
- [ ] T024 [P] Account, Event, Venue, Ticket, Registration models in src/models/eventos-types.ts (append)
- [ ] T025 [P] MCP protocol types (MCPToolRequest, MCPToolResponse, MCPError) in src/models/mcp-types.ts

### Services
- [ ] T026 Authentication service with token management in src/services/auth.ts
- [ ] T027 [P] Account management service in src/services/accounts.ts
- [ ] T028 [P] Ticket management service in src/services/tickets.ts

### Libraries
- [ ] T029 eventos API client with axios in src/lib/api-client.ts
- [ ] T030 Error handler with MCP error mapping in src/lib/error-handler.ts

### MCP Tools
- [ ] T031 MCP authentication tool (eventos_authenticate) in src/tools/auth-tool.ts
- [ ] T032 [P] MCP account tools (list, get, create, update, delete) in src/tools/account-tools.ts
- [ ] T033 [P] MCP ticket tools (list, get, create, update, delete) in src/tools/ticket-tools.ts

### Server
- [ ] T034 MCP server initialization and tool registration in src/cli/server.ts

## Phase 3.4: Integration
- [ ] T035 Connect all services to API client with proper error handling
- [ ] T036 Implement exponential backoff for rate limiting in src/lib/api-client.ts (update)
- [ ] T037 Add structured logging with MCP standard format
- [ ] T038 Environment variable validation on startup

## Phase 3.5: Polish
- [ ] T039 [P] Unit tests for Token validation in tests/unit/token-validation.test.ts
- [ ] T040 [P] Unit tests for Account validation in tests/unit/account-validation.test.ts
- [ ] T041 [P] Unit tests for Ticket validation in tests/unit/ticket-validation.test.ts
- [ ] T042 [P] Unit tests for error handler in tests/unit/error-handler.test.ts
- [ ] T043 Performance tests ensuring <500ms response time in tests/performance/response-time.test.ts
- [ ] T044 [P] Create README.md with installation and usage instructions
- [ ] T045 [P] Create API documentation in docs/api.md
- [ ] T046 Run quickstart validation script from quickstart.md

## Dependencies
- Setup (T001-T007) must complete first
- All tests (T008-T022) before any implementation (T023-T034)
- Models (T023-T025) before services (T026-T028)
- Services before MCP tools (T031-T033)
- API client (T029) and error handler (T030) before integration (T035-T038)
- All implementation before polish (T039-T046)

## Parallel Execution Examples

### Launch all contract tests together (T008-T018):
```
Task: "Contract test POST /token authentication in tests/contract/auth.contract.test.ts"
Task: "Contract test GET /accounts in tests/contract/accounts-list.contract.test.ts"
Task: "Contract test POST /accounts in tests/contract/accounts-create.contract.test.ts"
Task: "Contract test GET /accounts/{id} in tests/contract/accounts-get.contract.test.ts"
Task: "Contract test PUT /accounts/{id} in tests/contract/accounts-update.contract.test.ts"
Task: "Contract test DELETE /accounts/{id} in tests/contract/accounts-delete.contract.test.ts"
Task: "Contract test GET /tickets in tests/contract/tickets-list.contract.test.ts"
Task: "Contract test POST /tickets in tests/contract/tickets-create.contract.test.ts"
Task: "Contract test GET /tickets/{id} in tests/contract/tickets-get.contract.test.ts"
Task: "Contract test PUT /tickets/{id} in tests/contract/tickets-update.contract.test.ts"
Task: "Contract test DELETE /tickets/{id} in tests/contract/tickets-delete.contract.test.ts"
```

### Launch integration tests together (T019-T022):
```
Task: "Integration test MCP tool registration in tests/integration/mcp-server.test.ts"
Task: "Integration test authentication flow with token refresh in tests/integration/auth-flow.test.ts"
Task: "Integration test account CRUD operations via MCP tools in tests/integration/account-operations.test.ts"
Task: "Integration test ticket management via MCP tools in tests/integration/ticket-operations.test.ts"
```

### Launch model creation tasks together (T023-T025):
```
Task: "Token model with validation in src/models/eventos-types.ts"
Task: "MCP protocol types in src/models/mcp-types.ts"
```

## Notes
- [P] tasks = different files, no shared dependencies
- Verify all tests fail before implementing (RED phase of TDD)
- Commit after each task completion
- T024 appends to eventos-types.ts created by T023 (sequential)
- T036 updates api-client.ts created by T029 (sequential)

## Validation Checklist
*GATE: All must be checked before execution*

- [x] All contracts have corresponding tests (T008-T018 cover all endpoints)
- [x] All entities have model tasks (Token, Account, Ticket in T023-T024)
- [x] All tests come before implementation (T008-T022 before T023-T034)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task

---

**Total Tasks**: 46
**Parallel Groups**: 7 groups with 29 parallel tasks
**Estimated Time**: 2-3 days with parallel execution