# Authentication Test Rollback Strategy

## Overview
This document outlines the rollback strategy for authentication test changes to ensure system stability and quick recovery in case of failures.

## Branching Strategy

### Feature Branch Workflow
1. **Create feature branch** from `main`:
   ```bash
   git checkout -b feature/auth-test-phase-{n}
   ```
   - Example: `feature/auth-test-phase-5`

2. **Commit changes** with descriptive messages:
   ```bash
   git commit -m "Phase 5: Add accessibility tests for LoginFlow"
   ```

3. **Push to remote**:
   ```bash
   git push origin feature/auth-test-phase-{n}
   ```

4. **Create pull request** for review

### Hotfix Branch Workflow
For urgent test fixes:
1. Create hotfix branch from `main`:
   ```bash
   git checkout -b hotfix/auth-test-fix-{issue}
   ```

2. Apply minimal fix
3. Merge directly to `main` after quick review

## Failure Handling

### Test Failures
If tests fail after merging:

1. **Identify the failing phase**:
   - Check test output for specific test file
   - Review recent commits in that phase

2. **Rollback options**:
   - **Option A**: Revert the specific commit
     ```bash
     git revert <commit-hash>
     ```
   - **Option B**: Rollback to previous stable tag
     ```bash
     git checkout v{version}-stable
     ```
   - **Option C**: Disable failing tests temporarily
     ```javascript
     it.skip('failing test description', () => {
       // test code
     })
     ```

3. **Document the failure**:
   - Create issue in tracking system
   - Note the commit hash and error message
   - Tag with `auth-test-failure`

### Integration Failures
If integration tests fail:

1. **Check MSW handlers**:
   - Verify API endpoints are correctly mocked
   - Check for network latency issues
   - Review response data structure

2. **Check test utilities**:
   - Verify helper functions are working
   - Check fixture data validity
   - Review provider setup

3. **Rollback strategy**:
   - Revert MSW handler changes
   - Restore previous test utilities
   - Use original component mocks

## Recovery Procedures

### Phase-by-Phase Recovery
Each phase can be independently rolled back:

| Phase | Files Changed | Rollback Command |
|-------|---------------|------------------|
| Phase 1 | `LoginFlow.test.jsx`, `SignupFlow.test.jsx` | `git revert <phase1-commit>` |
| Phase 2 | `handlers.js`, `authData.js`, `authTestHelpers.jsx` | `git revert <phase2-commit>` |
| Phase 3 | `LoginFlow.integration.test.jsx` | `git revert <phase3-commit>` |
| Phase 4 | `SignupFlow.integration.test.jsx` | `git revert <phase4-commit>` |
| Phase 5 | `LoginFlow.accessibility.test.jsx` | `git revert <phase5-commit>` |
| Phase 6 | `MFA.integration.test.jsx` | `git revert <phase6-commit>` |
| Phase 7 | `Passkey.integration.test.jsx` | `git revert <phase7-commit>` |
| Phase 10 | `PasswordResetFlow.integration.test.jsx` | `git revert <phase10-commit>` |
| Phase 11 | `LoginFlow.security.test.jsx` | `git revert <phase11-commit>` |

### Quick Recovery Commands

#### Restore all test files to previous state:
```bash
git checkout main -- src/features/authentication/**/__tests__/
```

#### Restore MSW handlers:
```bash
git checkout main -- src/test/msw/handlers.js
```

#### Restore test utilities:
```bash
git checkout main -- src/test/utils/authTestHelpers.jsx
```

#### Restore test fixtures:
```bash
git checkout main -- src/test/fixtures/authData.js
```

## Validation After Rollback

1. **Run all authentication tests**:
   ```bash
   npm test -- --run src/features/authentication
   ```

2. **Run ESLint**:
   ```bash
   npx eslint src/features/authentication/**/*.test.jsx
   ```

3. **Verify CI/CD passes**:
   - Check pipeline status
   - Review build logs

4. **Document recovery**:
   - Update rollback strategy document
   - Note lessons learned
   - Update phase completion status

## Prevention Measures

### Pre-Merge Checklist
- [ ] All tests pass locally
- [ ] ESLint passes with no errors
- [ ] No unused imports or variables
- [ ] Mocks are properly configured
- [ ] MSW handlers cover all scenarios
- [ ] Test utilities are functional
- [ ] Fixture data is valid

### Code Review Checklist
- [ ] Changes align with phase objectives
- [ ] No breaking changes to existing tests
- [ ] New tests follow existing patterns
- [ ] Error handling is adequate
- [ ] Documentation is updated

## Emergency Contacts

For critical test failures:
1. **Lead Developer**: Review and approve rollback
2. **QA Team**: Validate rollback in staging
3. **DevOps Team**: Deploy rollback to production

## Version Tags

Create stable tags after each successful phase completion:
```bash
git tag -a v1.0.0-phase-{n}-stable -m "Phase {n} authentication tests stable"
git push origin v1.0.0-phase-{n}-stable
```

## Monitoring

After each phase deployment:
1. Monitor test execution time
2. Track flaky test rate
3. Review error patterns
4. Update rollback strategy based on findings
