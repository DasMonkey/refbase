# Implementation Plan

## Time Estimate: 8-11 Days Total
## Monthly Cost: $2-5 (OpenAI API)
## Setup Cost: ~$20-50 (Initial embeddings)

## Prerequisites
- [ ] Install required packages:
  ```bash
  npm install openai lru-cache
  npm install --save-dev @types/node ts-node
  ```
- [ ] Create `.env` entries:
  ```
  SEMANTIC_SEARCH_ENABLED=true
  OPENAI_API_KEY=sk-your-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-key
  ```

- [ ] 1. Database Schema Setup and Vector Extension (Day 1 - 4 hours)
  - [ ] 1.1 Enable pgvector in Supabase Dashboard
    - Go to Database → Extensions → Enable "vector"
    - **File**: Run in Supabase SQL Editor
    - **Code**: `CREATE EXTENSION IF NOT EXISTS vector;`
    - **Success Criteria**: Extension shows as enabled
  
  - [ ] 1.2 Add embedding columns to tables
    - **File**: `supabase/migrations/[timestamp]_add_semantic_search.sql`
    - Run migration script from design.md (lines 62-87)
    - **Success Criteria**: All tables have embedding columns
  
  - [ ] 1.3 Create vector indexes
    - **File**: Same migration file
    - Add indexes from design.md (lines 90-99)
    - **Success Criteria**: `\di` in SQL shows new indexes
  
  - [ ] 1.4 Create search functions
    - **File**: Same migration file
    - Add search functions from design.md (lines 103-144)
    - **Success Criteria**: Functions appear in Supabase Functions tab
  
  - _Requirements: 1.1, 1.2, 5.1, 5.2_
  - **Checkpoint**: Can manually insert and query vector data in Supabase

- [ ] 2. Core Embedding Service Implementation (Day 2 - 6 hours)
  - [ ] 2.1 Create EmbeddingService class
    - **File**: `src/services/EmbeddingService.ts`
    - Copy full implementation from design.md (lines 183-254)
    - **Success Criteria**: Service can generate test embeddings
    - **Test**: `await new EmbeddingService().generateEmbedding('test')`
    - _Requirements: 1.1, 5.2, 8.1, 8.4_

  - [ ] 2.2 Add conversation embedding methods
    - **File**: Same EmbeddingService.ts
    - Add `generateConversationEmbeddings()` method
    - **Success Criteria**: Can process conversation JSON structure
    - _Requirements: 1.1, 2.1, 8.3_

  - [ ] 2.3 Add bug and feature embedding methods
    - **File**: Same EmbeddingService.ts
    - Add `generateBugEmbeddings()` and `generateFeatureEmbeddings()`
    - **Success Criteria**: All content types have embedding methods
    - _Requirements: 1.1, 2.1, 8.1, 8.2_
  
  - **Checkpoint**: Can generate embeddings for test content via console

- [ ] 3. Semantic Search Core Functions (Day 3 - 5 hours)
  - [ ] 3.1 Implement vector similarity search functions
    - **File**: `supabase/migrations/[timestamp]_add_search_functions.sql`
    - Add search functions from design.md (lines 103-144)
    - Test with: `SELECT * FROM semantic_search_conversations('auth issues', 10, 0.7);`
    - **Success Criteria**: Functions return results with similarity scores
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [ ] 3.2 Create hybrid search functionality
    - **File**: `src/services/HybridSearchService.ts`
    - Implement hybrid search from design.md (lines 257-303)
    - **Test**: Verify both semantic and keyword results are merged
    - **Success Criteria**: No duplicate results, proper score weighting
    - _Requirements: 1.4, 4.4, 7.1_

  - [ ] 3.3 Add search result formatting and metadata
    - **File**: `src/types/search.ts`
    - Add SearchResult interface with score, type, preview fields
    - **Success Criteria**: Results include content previews and metadata
    - _Requirements: 7.1, 7.2, 7.3_
  
  - **Checkpoint**: Can perform semantic searches via SQL and get formatted results

- [ ] 4. API Endpoint Implementation (Day 4 - 5 hours)
  - [ ] 4.1 Create new semantic search API endpoint
    - **File**: `src/pages/api/search/semantic.ts`
    - Copy endpoint implementation from design.md (lines 306-361)
    - **Test**: `curl -X POST /api/search/semantic -d '{"query":"test"}'`
    - **Success Criteria**: Returns results with similarity scores
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.2 Enhance existing search endpoints with semantic support
    - **Files**: `src/pages/api/conversations.ts`, `src/pages/api/bugs.ts`, `src/pages/api/features.ts`
    - Add `searchMode` parameter: 'keyword' | 'semantic' | 'hybrid'
    - **Success Criteria**: Existing calls work unchanged (default to keyword)
    - _Requirements: 1.4, 3.3, 4.1_

  - [ ] 4.3 Add embedding generation triggers for new content
    - **File**: `src/hooks/useEmbeddingTrigger.ts`
    - Call `embeddingService.generateEmbeddings()` after content save
    - Use background job queue to avoid blocking UI
    - **Success Criteria**: New content gets embeddings within 30 seconds
    - _Requirements: 5.4, 6.4_
  
  - **Checkpoint**: API endpoints support semantic search with proper auth and validation

- [ ] 5. Frontend Search Interface Enhancement (Day 5 - 6 hours)
  - [ ] 5.1 Create useSemanticSearch custom hook
    - **File**: `src/hooks/useSemanticSearch.ts`
    - Copy implementation from design.md (lines 364-416)
    - **Test**: Import and use in test component
    - **Success Criteria**: Hook manages search state and caching
    - _Requirements: 4.1, 4.2, 7.4_

  - [ ] 5.2 Build enhanced SemanticSearchBar component
    - **File**: `src/components/SemanticSearchBar.tsx`
    - Copy component from design.md (lines 419-491)
    - Add Sparkles icon from lucide-react for semantic mode
    - **Success Criteria**: Mode selector works, visual indicators display
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 5.3 Implement search results display with similarity scores
    - **File**: `src/components/SearchResults.tsx`
    - Color code scores: >90% green, 70-90% yellow, <70% gray
    - Group by: Conversations, Bugs, Features sections
    - **Success Criteria**: Results show with proper formatting and scores
    - _Requirements: 7.1, 7.2, 7.3_
  
  - **Checkpoint**: Search UI works with mode selection and displays semantic results

- [ ] 6. Integration with Existing Components (Day 6 - 4 hours)
  - [ ] 6.1 Update ConversationsTab with semantic search
    - **File**: `src/components/ConversationsTab.tsx`
    - Replace `<input>` with `<SemanticSearchBar>`
    - Keep existing filter logic, add semantic mode
    - **Test**: Verify conversation selection still works
    - **Success Criteria**: Tab works with both search modes
    - _Requirements: 1.4, 4.1, 4.4_

  - [ ] 6.2 Enhance BugsTab and FeaturesTab search functionality
    - **Files**: `src/components/BugsTab.tsx`, `src/components/FeaturesTab.tsx`
    - Import and integrate SemanticSearchBar
    - Maintain existing severity/status filters
    - **Success Criteria**: All tabs have consistent search UI
    - _Requirements: 2.1, 2.2, 4.1_

  - [ ] 6.3 Add semantic search to global search functionality
    - **File**: `src/components/GlobalSearch.tsx` (new)
    - Create modal/dropdown accessible from header
    - Add localStorage for search history
    - **Success Criteria**: Global search accessible from any page
    - _Requirements: 2.1, 2.2, 4.1_
  
  - **Checkpoint**: All existing components support semantic search seamlessly

- [ ] 7. Data Migration and Embedding Generation (Day 7 - 6 hours)
  - [ ] 7.1 Create migration script for existing content
    - **File**: `scripts/migrate-embeddings.ts`
    - Copy migration script from design.md (lines 494-587)
    - Run with: `npm run migrate:embeddings`
    - **Progress**: Logs to `migration-progress.json`
    - **Success Criteria**: All existing content has embeddings
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 7.2 Implement embedding regeneration system
    - **File**: `src/services/EmbeddingRegenerator.ts`
    - Detect significant changes (>20% content change)
    - Queue regeneration with 5-minute debounce
    - **Success Criteria**: Updated content gets new embeddings
    - _Requirements: 6.4, 5.4_

  - [ ] 7.3 Add embedding health monitoring
    - **File**: `src/pages/api/admin/embedding-health.ts`
    - Track: success rate, API costs, avg generation time
    - Alert if success rate <95% or costs >$10/day
    - **Success Criteria**: Dashboard shows embedding health metrics
    - _Requirements: 5.3, 5.4_
  
  - **Checkpoint**: All existing content migrated, monitoring dashboard operational

- [ ] 8. MCP Server Integration (Day 8 - 4 hours)
  - [ ] 8.1 Enhance MCP search endpoints with semantic capabilities
    - **File**: `refbase-mcp/src/tools/conversation/SearchConversationsTool.ts`
    - Add `searchMode` parameter to tool schema
    - Call webapp's semantic API endpoint
    - **Success Criteria**: MCP can trigger semantic searches
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 8.2 Add semantic search configuration to MCP
    - **File**: `refbase-mcp/src/config/semanticSearch.ts`
    - Add config: mode preference, similarity threshold
    - Format results with relevance indicators for AI
    - **Success Criteria**: AI gets well-formatted semantic results
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 8.3 Test MCP integration with AI assistants
    - **Test in**: Cursor, Claude Code, VS Code
    - Query: "find authentication bugs" (semantic)
    - Verify: Results include related auth issues
    - **Success Criteria**: AI assistants can use semantic search
    - _Requirements: 3.1, 3.2, 3.3_
  
  - **Checkpoint**: MCP server fully supports semantic search for AI assistants

- [ ] 9. Performance Optimization and Caching (Day 9 - 5 hours)
  - [ ] 9.1 Implement search result caching
    - **File**: `src/services/SearchCache.ts`
    - Copy LRU cache implementation from design.md (lines 590-632)
    - Cache TTL: 15 minutes for search results
    - **Success Criteria**: Repeated searches return instantly
    - _Requirements: 5.1, 5.3_

  - [ ] 9.2 Optimize vector index performance
    - **File**: `supabase/migrations/[timestamp]_optimize_indexes.sql`
    - Set ivfflat lists = rows/1000 for optimal performance
    - Run: `VACUUM ANALYZE conversations_embedding;`
    - **Success Criteria**: Search queries <100ms for 100k vectors
    - _Requirements: 5.1, 5.3_

  - [ ] 9.3 Add search analytics and monitoring
    - **File**: `src/pages/api/admin/search-analytics.ts`
    - Track: popular queries, avg response time, cache hit rate
    - Log OpenAI costs per day/week/month
    - **Success Criteria**: Analytics dashboard shows usage patterns
    - _Requirements: 5.3, 5.4_
  
  - **Checkpoint**: Search performance optimized, caching active, analytics running

- [ ] 10. Testing and Quality Assurance (Day 10 - 5 hours)
  - [ ] 10.1 Create unit tests for embedding service
    - **File**: `src/services/__tests__/EmbeddingService.test.ts`
    - Test cases: empty text, max length, special chars, code blocks
    - Mock OpenAI API responses
    - **Success Criteria**: 100% test coverage for EmbeddingService
    - _Requirements: 1.1, 2.1, 8.1_

  - [ ] 10.2 Implement integration tests for search functionality
    - **File**: `src/pages/api/__tests__/semantic-search.test.ts`
    - Test: keyword-only, semantic-only, hybrid modes
    - Verify deduplication and score merging
    - **Success Criteria**: All search modes return expected results
    - _Requirements: 1.1, 1.4, 4.4_

  - [ ] 10.3 Add performance and load testing
    - **File**: `scripts/load-test-search.ts`
    - Simulate: 100 concurrent searches, 10k vectors
    - Measure: p50, p95, p99 response times
    - **Success Criteria**: p95 <500ms, p99 <1s
    - _Requirements: 5.1, 5.3_
  
  - **Checkpoint**: All tests passing, performance meets targets

- [ ] 11. Documentation and Deployment (Day 11 - 4 hours)
  - [ ] 11.1 Create user documentation for semantic search
    - **File**: `docs/semantic-search-guide.md`
    - Sections: What is semantic search, How to use, Tips
    - Include screenshots of UI with mode selector
    - **Success Criteria**: Users understand semantic vs keyword search
    - _Requirements: 4.1, 4.2, 7.4_

  - [ ] 11.2 Create developer documentation
    - **File**: `docs/api/semantic-search.md`
    - Document: POST /api/search/semantic endpoint
    - Include: Request/response examples, error codes
    - **Success Criteria**: API fully documented with examples
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 11.3 Deploy and monitor initial release
    - **Deploy steps**:
      1. Run database migrations in Supabase
      2. Set SEMANTIC_SEARCH_ENABLED=false initially
      3. Deploy webapp to production
      4. Run migration script for embeddings
      5. Set SEMANTIC_SEARCH_ENABLED=true when ready
    - **Monitor**: Error rates, API costs, user adoption
    - **Success Criteria**: Semantic search live with <1% error rate
    - _Requirements: 6.1, 6.2, 6.3_
  
  - **Checkpoint**: Feature fully deployed, documented, and monitored