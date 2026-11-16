import * as React from "react";
import { createRoot } from "react-dom/client";
import ArcoviaContact from "./mod/ArcoviaContact.js";
// The Contact instance's controls in "Arcovia Handoff (copy)" (xNdbX9OLd, 16 Nov). The Webhook URL comes from
// ?endpoint= (test.cjs passes CONTACT_ENDPOINT); requests to it are caught by the test, never sent.
const endpoint = new URLSearchParams(location.search).get("endpoint") || "https://hooks.airtable.com/workflows/v1/genericWebhook/appTEST/wflTEST/wtrTEST";
const props = {
  endpoint, sendAs: "form",
  chip: "Contact", title1: "Start a", title2: "conversation",
  lede: "Tell us who you are and what you need. The right person on our team will reply within two working days.",
  generalLabel: "General inquiries", generalEmail: "hello@arcovia.io", pressLabel: "Press", pressEmail: "press@arcovia.io",
  office1City: "Los Angeles", office1Address: "2029 Century Park East\nLos Angeles, CA 90067", office1Zone: "America/Los_Angeles",
  office2City: "San Juan", office2Address: "450 Ave. 200\nSan Juan, Puerto Rico 00901", office2Zone: "America/Puerto_Rico",
  thanks: "Thank you. Your note is with the right person on our team.", sheet: false,
  style: { width: "100%" },
};
createRoot(document.getElementById("root")).render(<ArcoviaContact {...props} />);
