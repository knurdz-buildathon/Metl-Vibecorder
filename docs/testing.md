# Test Plan

## Unit Tests

### Python Agent

```bash
cd apps/agent
source venv/bin/activate
pytest tests/ -v
```

### Next.js

```bash
cd apps/web
npm run typecheck
npm run lint
```

## Manual Scenarios

1. **ASK mode**: Ask "Explain the project structure" — should answer without edits.
2. **PLAN mode**: Request "Add a contact page" — should create plan, wait for approval.
3. **AGENT mode**: Request "Build a todo list app" — should generate code and run checks.
4. **REPAIR mode**: Trigger a type error, agent should fix it in max 2 attempts.
5. **REVIEW mode**: After agent mode, review should produce risk summary.
6. **Safety**: Try editing `.env` — should be blocked.
7. **Events**: Open session workspace, verify SSE connection and real-time logs.

## CI Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `pytest` passes
- [ ] Agent `/health` returns healthy
- [ ] Model `/model/health` returns configured
- [ ] Docker Compose starts postgres + redis
