# Decision log

Recorded 2 November 2026. Source: IDA_EduLink_ProjectSummary_v1.0, Section 3.

| ID | Decision | Outcome |
| --- | --- | --- |
| D-01 | Product owner | IDA owns the product, code, accounts and domains |
| D-02 | Project Manager | Managing Director |
| D-03 | Stack and hosting | React Native (Expo, TypeScript); NestJS API; PostgreSQL; Redis; HostAfrica Linux VPS |
| D-04 | Non-matching vacancies searchable | Yes; teachers are notified only on a match |
| D-05 | TRCN verification route | Open. Test TRCN verification API in Phase 1 spike |
| D-06 | Legal review | Open. Engage a Nigerian data-protection lawyer before beta |
| D-07 | Billing | No payments in the first release |
| D-08 | Product name | Working title EduLink until a name is cleared |
| D-09 | Budget | Hosting covered by IDA HostAfrica account; SMS, push and store accounts to be budgeted |
| D-10 | Beta region | Open. Recommended Lagos and Ogun |

## New decisions

| ID | Date | Decision | Reason |
| --- | --- | --- | --- |
| D-11 | 2 Nov 2026 | Repository uses separate folders per app, each with its own package.json; no workspace tooling at the start | Simplest for a solo developer and avoids mobile bundler problems with workspaces. Revisit if sharing code becomes painful |
