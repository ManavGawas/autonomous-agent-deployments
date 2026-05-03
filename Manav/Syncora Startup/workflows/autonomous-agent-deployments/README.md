# Enterprise RevOps Pipeline

An automated revenue-operations system built with n8n and Voiceflow. It captures leads, enriches company data, routes qualified prospects, checks calendar availability, and keeps the sales team informed without hardcoding secrets into workflows.

## What This Does

This pipeline connects your inbound lead and booking experience across two layers:

- n8n handles automation, enrichment, routing, notifications, and CRM sync.
- Voiceflow handles conversational intake, qualification, and scheduling logic.

The result is a clean RevOps system that can be exported, shared, and pushed to GitHub safely.

## Architecture

```text
Inbound lead or booking request
    -> n8n webhook
    -> enrichment and routing
    -> Airtable / HubSpot / Slack / Gmail / Calendar
    -> Voiceflow for conversation and qualification
```

### Primary automation paths

- Lead capture and CRM sync
- Company enrichment by email domain
- Booking confirmation and Slack alerts
- Calendar availability checks and event creation
- Voiceflow scheduling and fallback handling

## Folder Map

### `n8n-workflows/`
Production-style JSON workflows for automation and orchestration.

- `Lead Sync.json` - captures leads and syncs them to Airtable and HubSpot
- `Booking_sync.json` - posts booking notifications and updates CRM records
- `Enrichment API Workflow.json` - enriches companies through Apollo
- `Syncora Booking Check.json` - checks availability and books meetings
- `Demo App Scrape.json` - demo workflow for scraping or intake

### `voiceflows/`
Voiceflow project files and supporting notes for conversational scheduling.

- `Workflow 1.vf` through `Workflow 7.vf`
- `voiceflow_workflow.md` - flow breakdown and logic summary

## Security Model

This repo is designed to stay GitHub-safe.

- Secrets are stored in `.env` and excluded through `.gitignore`.
- Workflow files reference values through environment variables instead of raw keys.
- Voiceflow files should also avoid literal secrets, tokens, and live endpoints.

## Environment Variables

Create a local `.env` file from `.env.example` and fill in your values.

Common values used by the workflows:

- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_ID`
- `APOLLO_API_KEY`
- `SLACK_CHANNEL_ID`
- `EMAIL_ADDRESS`
- `N8N_AIRTABLE_CREDENTIAL_ID`
- `N8N_HUBSPOT_CREDENTIAL_ID`
- `N8N_GMAIL_CREDENTIAL_ID`
- `N8N_SLACK_CREDENTIAL_ID`
- `N8N_OPENAI_CREDENTIAL_ID`
- `N8N_GOOGLE_CALENDAR_CREDENTIAL_ID`

## Setup

1. Copy `.env.example` to `.env`.
2. Populate the required environment variables.
3. Import the n8n JSON files into your n8n instance.
4. Reconnect credentials inside n8n using your local accounts.
5. Import or open the Voiceflow workflows and verify any API or webhook references.

## How the Pipeline Works

### 1. Lead intake
A webhook receives lead data such as name, email, company, social links, and meeting preferences.

### 2. Enrichment
The email domain is sent to Apollo to enrich company size, industry, website, phone, and revenue signals.

### 3. CRM sync
Qualified data is written to Airtable and HubSpot so the team has one source of truth.

### 4. Booking and alerts
When a meeting is booked, Slack gets a notification and calendar availability is checked before the event is created.

### 5. Conversational scheduling
Voiceflow manages the user-facing scheduling logic, including confirm, reschedule, and fallback paths.

## Voiceflow Design Notes

The Voiceflow logic is centered on a simple scheduling decision tree:

- Confirm the proposed time when the user says yes.
- Ask for an alternative time when the user says no.
- Clarify when the input is ambiguous.

That structure keeps the flow lightweight while still being usable in production.

## Best Practices Before Committing

- Never commit `.env`.
- Never paste live API keys directly into workflow files.
- Replace any personal emails with environment-backed placeholders where possible.
- Recheck imported n8n credentials after every import or environment change.

## GitHub Readiness Checklist

- Secrets removed from JSON workflows
- `.env.example` included for setup guidance
- `.gitignore` prevents accidental secret commits
- Voiceflow content reviewed for hardcoded values
- README documents the system clearly for collaborators

## Suggested Next Steps

1. Add any missing environment variables used by your local n8n instance.
2. Rotate any keys that were previously exposed in committed files.
3. Validate the imported workflows in a staging n8n workspace.
4. Add a deployment note if you want future collaborators to import and run this faster.

## License

Internal use only for Syncora Systems.
