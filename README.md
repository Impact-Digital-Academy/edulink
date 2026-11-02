# EduLink (working title)

Mobile marketplace connecting Nigerian school owners with teachers and education students.
Teachers build progressive profiles; verified schools post vacancies; teachers are notified only
when a vacancy genuinely matches their subjects, levels, location and job type.

Owner: Impact Digital Academy (IDA). Built under the IDA Software Delivery Standards v1.0.

## Repository layout

| Folder | Purpose | Status |
| --- | --- | --- |
| apps/mobile | React Native (Expo, TypeScript) app | Not started |
| apps/api | NestJS API, PostgreSQL, Redis queue | Not started |
| apps/admin | Web admin back office | Not started |
| infra | Server, deployment and backup scripts | Not started |
| docs | Decisions, project log, Definition of Done, contributing rules | Started |

## Before you do anything

1. Read docs/CONTRIBUTING.md (branches, commits, pull requests).
2. Read docs/DEFINITION_OF_DONE.md.
3. Never commit secrets. Copy .env.example to .env locally and fill it in. Real values live in the
   IDA password manager.

## Key documents (kept outside the repo in the IDA project folder)

- IDA_EduLink_ProjectSummary_v1.0
- IDA_EduLink_DeveloperDocument (current version)

## Environments

| Environment | Data | Notes |
| --- | --- | --- |
| Local | Fake data only | Developer machine |
| Staging | Anonymised or fake data | HostAfrica VPS, test-mode providers |
| Production | Real data | HostAfrica VPS, live keys |
