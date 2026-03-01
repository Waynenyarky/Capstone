# Capstone Documentation

This directory contains security documentation, deployment guide, troubleshooting, and maintenance notes.

- **Security** — [security/README.md](security/README.md): overview, database security, CSRF, threat model (STRIDE, OWASP, risk analysis, data flow), and optional requirements traceability.
- **Deployment** — [deployment/README.md](deployment/README.md): local development, MongoDB Atlas, and production deployment.
- **Troubleshooting** — [troubleshooting/README.md](troubleshooting/README.md): common issues and fixes for Docker, MongoDB, IPFS, auth, and APIs.
- **Maintenance** — [maintenance/README.md](maintenance/README.md): recurring tasks, backups, threat model review, MFA reset, and secrets rotation.
- **LOB AI Model** — [ai-lob-model-creation-and-flow.md](ai-lob-model-creation-and-flow.md): how the LOB recommendation model was created (Raw data → Preprocessing → Split → Training → Optimization → Deployment), with training techniques and evaluation metrics. [Improvement plan & requirements checklist](ai-lob-improvement-plan-and-requirements.md). [Pipeline (scripts)](ai-lob-model-pipeline.md). [Training & API](lob_model_training.md).

For the full Information Assurance and Security (IAS) checklist with implementation and test steps, see [../temp/information_assurance_and_security_checklist.md](../temp/information_assurance_and_security_checklist.md).
