# Security Policy

## Supported Versions

Only the latest version of TaleWeaver (deployed on `main`) receives security fixes.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, email the maintainers directly or use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) feature.

Include as much detail as possible:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You can expect an acknowledgement within 48 hours and a resolution timeline within 7 days for critical issues.

## Scope

Areas of particular concern for this project:

### High priority
- **Prompt injection** — inputs that manipulate the AI into producing content unsafe for children
- **Content safety bypass** — any technique that causes the storyteller to generate violent, sexual, or otherwise inappropriate content for minors
- **GCP credential exposure** — anything that could leak the service account or API keys
- **WebSocket session hijacking** — unauthorized access to another user's live story session

### In scope
- Backend API endpoints (`/api/*`, `/ws/story`)
- AI prompt handling and tool call responses
- Image generation pipeline
- Any client-side input that reaches the backend or Gemini

### Out of scope
- Denial of service attacks
- Issues in third-party dependencies (report those upstream)
- Theoretical vulnerabilities with no practical exploit path

## Security Considerations for Contributors

- **Never commit secrets.** API keys, `.env` files, and GCP credentials must never be committed. Use Secret Manager and Application Default Credentials as the project already does.
- **Sanitize all user input** before it reaches the Gemini API or image generation pipeline.
- **System prompt changes** can introduce content safety regressions — all prompt modifications should be reviewed carefully for potential bypass vectors.
- **Child safety is the top priority.** This app is used by children aged 4–10. Any vulnerability that could expose a child to harmful content is treated as critical severity.
