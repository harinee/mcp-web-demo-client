# Security Guidelines for MCP Demo Client

## ⚠️ IMPORTANT SECURITY NOTICE

This project is **INTENTIONALLY VULNERABLE** and designed for educational purposes only. It should **NEVER** be deployed in production environments.

## Personal Information Protection

When contributing to or using this project, please ensure you do not expose:

### 1. Personal Identifiers
- Real names in code comments or commit messages
- Personal email addresses
- Phone numbers or addresses
- Social media handles

### 2. System Information
- Local file paths (use relative paths only)
- Machine-specific configurations
- Operating system details
- Hardware specifications

### 3. Network Information
- Internal IP addresses
- Network topology details
- Router configurations
- VPN settings

### 4. Credentials and Secrets
- API keys or tokens
- Passwords or passphrases
- SSH keys or certificates
- Database connection strings

## Safe Development Practices

### Environment Variables
Use environment variables for any configuration that might vary between systems:

```bash
# Good - use environment variables
SERVER_URL=${MCP_SERVER_URL:-http://localhost:9001}

# Bad - hardcoded personal paths
SERVER_URL=http://192.168.1.100:9001
```

### Git Configuration
Before committing, ensure your git configuration doesn't expose personal information:

```bash
# Check current git config
git config --list

# Use generic information for public repos
git config user.name "Demo Contributor"
git config user.email "demo@example.com"
```

### File Paths
Always use relative paths in code:

```javascript
// Good - relative paths
const configPath = './config/settings.json';

// Bad - absolute paths with personal info
const configPath = '/Users/yourname/Documents/project/config/settings.json';
```

## What This Project Intentionally Exposes (For Educational Purposes)

This demo client intentionally demonstrates these vulnerabilities:

1. **Insecure Storage**: Credentials stored in localStorage
2. **Information Disclosure**: Debug logs exposing internal state
3. **XSS Vulnerabilities**: Unescaped user input
4. **Code Injection**: eval() usage on server responses
5. **CSRF**: No request validation
6. **Excessive Data Sharing**: Browser fingerprinting

## Files to Review Before Committing

Always check these files for sensitive information:

- [ ] `README.md` - Remove personal examples
- [ ] `package.json` - Use generic author information
- [ ] `*.js` files - Remove hardcoded paths/URLs
- [ ] `*.sh` scripts - Remove system-specific commands
- [ ] Git commit messages - Avoid personal references

## Reporting Security Issues

If you find unintentional security vulnerabilities (beyond the intentional ones), please:

1. **DO NOT** create a public issue
2. Contact the maintainers privately
3. Provide details about the vulnerability
4. Allow time for assessment and fixes

## License Compliance

This project uses a custom license that prohibits commercial use. Ensure any contributions comply with the license terms in the `LICENSE` file.

## Educational Use Only

Remember:
- This software is for learning purposes only
- Never deploy in production environments
- Use only in isolated, controlled environments
- Understand the vulnerabilities before demonstrating them
- Always explain the security implications to your audience

## Questions?

If you have questions about security practices for this project, please open an issue with the `security` label.
