# Website enquiries in Airtable

Both website forms post straight to an Airtable automation ("When webhook received"), form-encoded
(Airtable's webhook sends no CORS headers, so a browser JSON request is blocked; a form-encoded one is
not). One table, two automations: **Contact page form** (`ArcoviaContact`, `contact.js`) and
**Team page form** (the "Contact <name> via Arcovia" note on team profiles, `ArcoviaNote`). Every new
enquiry emails lilla@arcovia.io and colin@arcovia.io. The base is "Website enquiries", shared with
nodedesignagency@gmail.com (Creator); it is separate from Arcovia's own workspace, which holds their
investor lists. No Airtable token is used anywhere.

## 1. The table

1. In the base, **+ Add or import → CSV file**, upload `website-enquiries.csv`, import as a new table
   and name it **Website enquiries** (delete the empty "Table 1" afterwards).
2. Field types: **Type** → Single select (its six options come from the example rows), **Email** →
   Email, **Details** → Long text, **Page** → URL. The rest stay single line text.
3. Add a field **Received** → Created time (show the time).
4. Delete the six example rows.

## 2. The automations

1. **Automations → Create automation**, name it "Contact page form", trigger **When webhook
   received**, copy its link. Do the same for "Team page form".
2. The links go into Framer: Contact page → instance "Contact" → Webhook URL; Team profile template
   → "Contact note (ArcoviaNote)" → Webhook URL (Send as stays **Form**). Then send each a sample:
   `tools/airtable/send-sample.sh contact <link>` and `tools/airtable/send-sample.sh note <link>`.
3. In each automation, **Test trigger**: the sample shows up with every field.
4. Action **Create record**, table Website enquiries, fields from the webhook body:

   | Column       | Field                       |
   |--------------|-----------------------------|
   | Name         | `full_name`                 |
   | Type         | `type_label`                |
   | Email        | `email`                     |
   | Organisation | `organisation_name`         |
   | Role         | `role`                      |
   | Details      | `details`                   |
   | Team member  | `advisor` (Team page form)  |
   | Source       | `source`                    |
   | Page         | `page`                      |

   Test it (a row appears), then delete that row.
5. Action **Send email**. While testing, send it to yourself; then set **To** to
   `lilla@arcovia.io, colin@arcovia.io`. Subject: `New website enquiry: {type_label} from {full_name}`.
   Message: name, email, organisation, role, team member (Team page form), details, page.
6. Turn both automations **on**, then send a real note from each form on the Framer preview.

Each submission is one automation run (Free plan: 100 runs a month for the workspace). Anyone with a
link can post to it; the forms' spam trap drops bot notes before they are sent.

## What the forms send

Every field of the form (empty ones as `""`, so each note has the same keys), the visit source
(`utm_*`, `landing_page`, `referrer`), `page`, `submitted_at`, `seconds_on_form`, and four ready-made
fields for the table: `type_label` (the type in words), `organisation_name` (company, firm,
organisation or current firm, whichever was asked), `source` (UTM tags, else the referrer, else
"Direct") and `details` (every other answer as "Label: value" lines). The raw fields stay in the
webhook body, so a column can be added later without changing the site.
