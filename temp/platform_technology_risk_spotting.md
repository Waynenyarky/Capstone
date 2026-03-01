## 2. Activity 2: Security Risk Spotting

Using the **Input → Processing → Output** diagram for the BizClear web application.

---


| Stage          | Risk                                         | Mitigation                                                                                                                                                                                                                             |
| -------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**      | **Prompt injection in form fields**          | Sanitize all form fields in the business-service (HTML strip, entity escape, length limit) before forwarding to the AI service. Use a strict prompt template: "Validate these fields: {field}={value}." Treat user input as data only. |
| **Input**      | **Malicious document upload**                | Enforce server-side file validation: whitelist MIME types, max file size (e.g., 10MB), magic-byte check. Reject invalid files before any processing or AI call.                                                                        |
| **Input**      | **Oversized input / DoS**                    | Enforce max field length (e.g., 200 chars) and request body size at the API gateway or business-service. Rate limit per user/session (e.g., 10 validations/min). Return 429 with retry-after.                                          |
| **Processing** | **Gemini API key leakage**                   | Keep the key in `.env` (gitignored), never echo it in logs or responses. Use generic error messages for clients.                                                                                                                       |
| **Processing** | **Unauthorized AI validation bypass**        | Enforce JWT on all AI endpoints. Restrict AI validation to authenticated business owners (own submissions) and LGU officers/staff. Require business-service or officer context to call the AI service.                                 |
| **Output**     | **Information leakage in validation errors** | Return generic, user-friendly errors only. Never reveal model internals, API responses, or raw validation details to end users.                                                                                                        |
|                |                                              |                                                                                                                                                                                                                                        |


---

### BizClear Web Application — Blockchain Audit Flow

**IPO Diagram:**


| Stage          | Risk                               | Mitigation                                                                                                                                                                      |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                |                                    |                                                                                                                                                                                 |
|                |                                    |                                                                                                                                                                                 |
| **Processing** | **Rate limit bypass**              | Enforce rate limiting server-side in the audit-service (e.g., 20 logs/min per service/key). Use token bucket or sliding window. Return 429 with retry-after.                    |
| **Processing** | **Ganache / RPC compromise**       | Run Ganache in isolated Docker. Restrict RPC access to backend network only. For production, consider a more secure network with proper node hardening.                         |
| **Output**     | **Hash enumeration**               | Document that hash existence is public by design for audit. Add rate limiting on verify endpoints to slow enumeration if needed.                                                |
| **Output**     | **Replay / verification spoofing** | Ensure verify-data re-hashes the supplied content and checks against on-chain hash. Never trust client-supplied hash for verification—always recompute from data on the server. |


---

