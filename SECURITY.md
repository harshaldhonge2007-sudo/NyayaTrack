# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security and integrity of NyayaTrack and user legal documentation seriously.

If you discover a potential security vulnerability or sensitive data leak:
1. **Do not disclose publicly**: Do not create a public GitHub issue.
2. **Email Security Contact**: Please email `harshaldhonge2007@gmail.com` with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. **Response Timeline**:
   - Initial acknowledgement within 24 hours
   - Status update and remediation plan within 72 hours

## Security Controls Implemented in NyayaTrack

1. **Zero Statutory Fabrication Guardrails**:
   - Verbatim substring matching verifies all extracted quotes against source documents.
   - Grounded RAG with exact statutory source attribution.
2. **Deterministic Computation**:
   - Date calculations and financial percentage diffs are processed in pure code rather than LLM inference, preventing prompt injection math tampering.
3. **Enterprise HTTP Security Headers**:
   - `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
4. **Data Isolation**:
   - In-memory document processing with no persistent external third-party data tracking.
