# Definition of Done

Adapted from the IDA Software Delivery Standards (Section 6.7). Compare with the source document
and correct this file if the wording differs.

A feature or fix is done only when all of these are true:

- [ ] Acceptance criteria in the Developer Document are met and demonstrated.
- [ ] Code reviewed and approved by someone other than the author.
- [ ] Tested by someone other than the author (high-risk features need full test cases, negative
      tests and security tests).
- [ ] Automated tests added or updated and passing.
- [ ] Lint, formatting, dependency audit and secret scan pass.
- [ ] No secrets, test accounts or debug code left in the change.
- [ ] Inputs validated, permissions checked on the server, errors handled without exposing details.
- [ ] Works on a low-end Android phone and on a slow connection where relevant.
- [ ] Documentation updated (README, decision log, user or admin guide as needed).
- [ ] Deployed to staging and verified there.
- [ ] No known open critical or high defects.
