export interface SecurityRule {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  pattern: RegExp;
  level: 1 | 2 | 3; // ASVS levels
  owaspTop10: string[]; // OWASP Top 10 2021 mappings
}

export interface SecurityFinding {
  rule: SecurityRule;
  file: string;
  line: number;
  code: string;
  match: string;
}

// ASVS-based security rules
export const asvsRules: SecurityRule[] = [
  // V2: Authentication
  {
    id: 'V2.1.1',
    category: 'Authentication',
    title: 'Hardcoded Credentials',
    description: 'Credentials should not be hardcoded in source code',
    severity: 'critical',
    pattern: /(?<!\/\/\s*)(?<!process\.env\.)(?<!import.*)(?<!export.*)(?<![A-Z][a-zA-Z]*)\b(password|passwd|pwd|secret|api[_-]?key|apikey|token)\s*=\s*["'](?!.*\{.*\}|.*<.*>|.*\$\{|\s*$|test|example|demo|placeholder|xxx|auth\.|api\.|\/|\.)[^"']{6,}["']/gi,
    level: 1,
    owaspTop10: ['A07:2021 - Identification and Authentication Failures'],
  },
  {
    id: 'V2.1.2',
    category: 'Authentication',
    title: 'Weak Password Requirements',
    description: 'Password validation should enforce strong requirements',
    severity: 'high',
    pattern: /password.*length.*[<<=]\s*[1-7](?!\d)/gi,
    level: 1,
    owaspTop10: ['A07:2021 - Identification and Authentication Failures'],
  },

  // V3: Session Management
  {
    id: 'V3.2.1',
    category: 'Session Management',
    title: 'Insecure Cookie Configuration',
    description: 'Cookies should be configured with secure flags',
    severity: 'high',
    pattern: /setCookie\([^)]*\)(?!.*secure.*httponly)/gi,
    level: 1,
    owaspTop10: ['A07:2021 - Identification and Authentication Failures'],
  },
  {
    id: 'V3.3.1',
    category: 'Session Management',
    title: 'Session ID in URL',
    description: 'Session identifiers should not be exposed in URLs',
    severity: 'high',
    pattern: /(sessionid|session_id|sessid).*[?&]/gi,
    level: 1,
    owaspTop10: ['A07:2021 - Identification and Authentication Failures', 'A01:2021 - Broken Access Control'],
  },

  // V5: Input Validation
  {
    id: 'V5.1.1',
    category: 'Input Validation',
    title: 'SQL Injection Risk',
    description: 'SQL queries should use parameterized statements',
    severity: 'critical',
    pattern: /(execute|query|exec)\s*\(\s*["'`].*\+.*["'`]\s*\)/gi,
    level: 1,
    owaspTop10: ['A03:2021 - Injection'],
  },
  {
    id: 'V5.1.2',
    category: 'Input Validation',
    title: 'Command Injection Risk',
    description: 'System commands should not use unsanitized input',
    severity: 'critical',
    pattern: /(exec|system|spawn|Runtime\.getRuntime\(\)\.exec)\s*\([^)]*\+[^)]*\)/gi,
    level: 1,
    owaspTop10: ['A03:2021 - Injection'],
  },
  {
    id: 'V5.2.1',
    category: 'Input Validation',
    title: 'Path Traversal Risk',
    description: 'File paths should be validated to prevent directory traversal',
    severity: 'high',
    pattern: /(readFile|writeFile|openFile|fopen).*\.\./gi,
    level: 1,
    owaspTop10: ['A01:2021 - Broken Access Control'],
  },
  {
    id: 'V5.3.1',
    category: 'Input Validation',
    title: 'XSS Risk - innerHTML',
    description: 'User input should not be directly inserted into DOM',
    severity: 'high',
    pattern: /\.innerHTML\s*=.*(?!DOMPurify)/gi,
    level: 1,
    owaspTop10: ['A03:2021 - Injection'],
  },
  {
    id: 'V5.3.2',
    category: 'Input Validation',
    title: 'XSS Risk - dangerouslySetInnerHTML',
    description: 'dangerouslySetInnerHTML should be used with sanitized content only',
    severity: 'high',
    pattern: /dangerouslySetInnerHTML.*__html:(?!.*DOMPurify)/gi,
    level: 1,
    owaspTop10: ['A03:2021 - Injection'],
  },
  {
    id: 'V5.3.3',
    category: 'Input Validation',
    title: 'XSS Risk - eval',
    description: 'eval() should never be used with user input',
    severity: 'critical',
    pattern: /(?<!\/\/\s*)(?<!\/\*.*)(?<!\.)(?<!\w)\beval\s*\((?!.*JSON)(?!\s*\))/gi,
    level: 1,
    owaspTop10: ['A03:2021 - Injection'],
  },

  // V6: Cryptography
  {
    id: 'V6.2.1',
    category: 'Cryptography',
    title: 'Weak Cryptographic Algorithm',
    description: 'Weak cryptographic algorithms should not be used',
    severity: 'high',
    pattern: /(MD5|SHA1|DES|RC4|ECB)\s*\(/gi,
    level: 1,
    owaspTop10: ['A02:2021 - Cryptographic Failures'],
  },
  {
    id: 'V6.2.2',
    category: 'Cryptography',
    title: 'Hardcoded Encryption Key',
    description: 'Encryption keys should not be hardcoded',
    severity: 'critical',
    pattern: /(encryption[_-]?key|secret[_-]?key|cipher[_-]?key)\s*=\s*["'][^"']{8,}["']/gi,
    level: 1,
    owaspTop10: ['A02:2021 - Cryptographic Failures'],
  },
  {
    id: 'V6.2.3',
    category: 'Cryptography',
    title: 'Insecure Random Number Generation',
    description: 'Cryptographically secure random number generators should be used for security-sensitive operations',
    severity: 'medium',
    pattern: /Math\.random\(\).*\b(password|token|secret|key|salt|nonce|session)/gi,
    level: 2,
    owaspTop10: ['A02:2021 - Cryptographic Failures'],
  },

  // V7: Error Handling and Logging
  {
    id: 'V7.4.1',
    category: 'Error Handling',
    title: 'Sensitive Data in Logs',
    description: 'Sensitive information should not be logged',
    severity: 'medium',
    pattern: /console\.(log|error|warn).*\b(password|token|secret|credit[_-]?card|ssn)\b/gi,
    level: 2,
    owaspTop10: ['A09:2021 - Security Logging and Monitoring Failures'],
  },
  {
    id: 'V7.4.2',
    category: 'Error Handling',
    title: 'Stack Trace Exposure',
    description: 'Stack traces should not be exposed to users in production',
    severity: 'medium',
    pattern: /(?<!\/\/\s*)(printStackTrace|print_r|var_dump)(?!.*development|.*debug|.*test)/gi,
    level: 2,
    owaspTop10: ['A05:2021 - Security Misconfiguration'],
  },

  // V8: Data Protection
  {
    id: 'V8.3.1',
    category: 'Data Protection',
    title: 'Sensitive Data in Local Storage',
    description: 'Sensitive data should not be stored in localStorage',
    severity: 'high',
    pattern: /localStorage\.setItem.*\b(password|token|secret|credit[_-]?card|ssn)\b/gi,
    level: 1,
    owaspTop10: ['A02:2021 - Cryptographic Failures', 'A04:2021 - Insecure Design'],
  },

  // V9: Communications
  {
    id: 'V9.1.1',
    category: 'Communications',
    title: 'Insecure HTTP Connection',
    description: 'All connections should use HTTPS in production',
    severity: 'high',
    pattern: /(?<!\/\/\s*)(?<!http)http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com|test\.|schema)/gi,
    level: 1,
    owaspTop10: ['A02:2021 - Cryptographic Failures'],
  },
  {
    id: 'V9.2.1',
    category: 'Communications',
    title: 'SSL/TLS Verification Disabled',
    description: 'SSL/TLS certificate verification should not be disabled',
    severity: 'critical',
    pattern: /(rejectUnauthorized|verify|SSL_VERIFY).*false/gi,
    level: 1,
    owaspTop10: ['A02:2021 - Cryptographic Failures', 'A05:2021 - Security Misconfiguration'],
  },

  // V10: Malicious Code
  {
    id: 'V10.3.1',
    category: 'Malicious Code',
    title: 'Backdoor Pattern',
    description: 'Potential backdoor or debug code detected',
    severity: 'critical',
    pattern: /(backdoor|debug[_-]?mode|admin[_-]?override).*=.*true/gi,
    level: 1,
    owaspTop10: ['A04:2021 - Insecure Design'],
  },

  // V12: Files and Resources
  {
    id: 'V12.1.1',
    category: 'Files and Resources',
    title: 'File Upload without Validation',
    description: 'File uploads should validate file type and size',
    severity: 'high',
    pattern: /multer\(|upload\.single|formidable(?!.*fileFilter)/gi,
    level: 1,
    owaspTop10: ['A03:2021 - Injection', 'A04:2021 - Insecure Design'],
  },

  // V13: API and Web Service
  {
    id: 'V13.1.1',
    category: 'API Security',
    title: 'Missing Rate Limiting',
    description: 'Sensitive API endpoints should implement rate limiting',
    severity: 'medium',
    pattern: /app\.(post|put|delete)\s*\(['"]\/(login|register|auth|api|password|reset).*async.*\)(?!.*rateLimit)/gi,
    level: 2,
    owaspTop10: ['A07:2021 - Identification and Authentication Failures'],
  },
  {
    id: 'V13.2.1',
    category: 'API Security',
    title: 'CORS Misconfiguration',
    description: 'CORS should not allow all origins',
    severity: 'high',
    pattern: /Access-Control-Allow-Origin.*\*/gi,
    level: 1,
    owaspTop10: ['A05:2021 - Security Misconfiguration'],
  },

  // V14: Configuration
  {
    id: 'V14.2.1',
    category: 'Configuration',
    title: 'Debug Mode Enabled',
    description: 'Debug mode should be disabled in production',
    severity: 'high',
    pattern: /(?<!\/\/\s*)(?<!process\.env\.)(DEBUG|NODE_ENV)\s*=\s*["'](true|1|development)["'](?!.*process\.env|.*config)/gi,
    level: 1,
    owaspTop10: ['A05:2021 - Security Misconfiguration'],
  },
];

export function getASVSLevelRules(level: 1 | 2 | 3): SecurityRule[] {
  return asvsRules.filter(rule => rule.level <= level);
}

export function getRulesByCategory(category: string): SecurityRule[] {
  return asvsRules.filter(rule => rule.category === category);
}

export function getCategories(): string[] {
  return Array.from(new Set(asvsRules.map(rule => rule.category)));
}
