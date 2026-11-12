#!/usr/bin/env bash
# Sends one sample enquiry to an Airtable "When webhook received" link, form-encoded exactly as the
# website's forms send it, with every field filled so Airtable offers each one when mapping.
# Usage: tools/airtable/send-sample.sh contact <webhook-url>   (the Contact page form)
#        tools/airtable/send-sample.sh note <webhook-url>      (the team profile "Contact <name>" form)
set -euo pipefail
kind="${1:?contact or note}"; url="${2:?webhook URL}"
visit=(--data-urlencode "utm_source=sample" --data-urlencode "utm_medium=sample" --data-urlencode "utm_campaign=sample"
  --data-urlencode "utm_term=sample" --data-urlencode "utm_content=sample" --data-urlencode "landing_page=https://arcovia.io/"
  --data-urlencode "referrer=https://www.google.com/" --data-urlencode "submitted_at=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
  --data-urlencode "seconds_on_form=60" --data-urlencode "consent=yes" --data-urlencode "source=sample / sample / sample")
if [ "$kind" = contact ]; then
  curl -sS -X POST "$url" "${visit[@]}" \
    --data-urlencode "tag=founder" --data-urlencode "type_label=Raising capital" \
    --data-urlencode "full_name=Sample Person" --data-urlencode "email=sample@example.com" --data-urlencode "role=CEO" \
    --data-urlencode "company_name=Sample Co" --data-urlencode "firm=Sample Capital" --data-urlencode "organisation=Sample Org" \
    --data-urlencode "current_firm=Sample Bank" --data-urlencode "organisation_name=Sample Co" \
    --data-urlencode "website=https://example.com" --data-urlencode "stage=Seed" --data-urlencode "sector=Energy" \
    --data-urlencode "raise_amount=\$5–25M" --data-urlencode "funds_needed_by=Within 6 months" --data-urlencode "building=Sample text" \
    --data-urlencode "investor_type=Family office" --data-urlencode "check_size=\$1–5M" --data-urlencode "stages=Seed" \
    --data-urlencode "sectors=Energy" --data-urlencode "geographies=US" --data-urlencode "convinces_first=Sample text" \
    --data-urlencode "never_send=Sample text" --data-urlencode "country=UAE" --data-urlencode "topic=Infrastructure" \
    --data-urlencode "note=Sample text" --data-urlencode "partner_type=Press" --data-urlencode "linkedin_url=https://linkedin.com/in/sample" \
    --data-urlencode "page=https://arcovia.io/contact" \
    --data-urlencode $'details=Website: https://example.com\nStage: Seed\nAmount raising: $5–25M\nWhat we’re building: Sample text'
else
  curl -sS -X POST "$url" "${visit[@]}" \
    --data-urlencode "tag=advisor" --data-urlencode "type_label=Note to a team member" \
    --data-urlencode "advisor=Colin Pham" --data-urlencode "advisor_slug=colin-pham" \
    --data-urlencode "full_name=Sample Person" --data-urlencode "email=sample@example.com" --data-urlencode "role=Partner" \
    --data-urlencode "company_name=Sample Co" --data-urlencode "organisation_name=Sample Co" --data-urlencode "note=Sample text" \
    --data-urlencode "page=https://arcovia.io/team/colin-pham" \
    --data-urlencode "details=I’d like to talk about: Sample text"
fi
echo
