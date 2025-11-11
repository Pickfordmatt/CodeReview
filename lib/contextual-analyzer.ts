import { SecurityRule, SecurityFinding } from './asvs-rules';
import { FileContent } from './code-analyzer';

interface CodeContext {
  fileContent: string;
  fileName: string;
  lines: string[];
  language: string;
}

// Helper to get surrounding context for a line
function getContext(lines: string[], lineIndex: number, contextSize: number = 5): string {
  const start = Math.max(0, lineIndex - contextSize);
  const end = Math.min(lines.length, lineIndex + contextSize + 1);
  return lines.slice(start, end).join('\n');
}

// Check if a variable is user input based on surrounding code
function isUserInput(context: string, varName: string): boolean {
  const userInputPatterns = [
    /req\.(body|query|params|headers)/,
    /request\.(form|args|values|json|data)/,
    /input\(/,
    /scanf|gets|fgets/,
    /readLine|readline/,
    /document\.(getElementById|querySelector).*\.value/,
    /prompt\(/,
    /process\.argv/,
    /sys\.argv/,
    /os\.Getenv/,
  ];

  return userInputPatterns.some(pattern =>
    context.includes(varName) && pattern.test(context)
  );
}

// Check if data is sanitized
function isSanitized(context: string): boolean {
  const sanitizationPatterns = [
    /escape|sanitize|clean|validate|filter/i,
    /DOMPurify/,
    /prepared.*statement/i,
    /parameterized/i,
    /\.prepare\(/,
    /\?\s*,/,  // SQL placeholders
    /:\w+/,     // Named parameters
  ];

  return sanitizationPatterns.some(pattern => pattern.test(context));
}

// Contextual SQL Injection detector
function detectSQLInjection(ctx: CodeContext): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  // Pattern: SQL query construction with concatenation
  const sqlPattern = /(execute|query|exec|prepare|sql)\s*\([^)]*["'`][^"'`]*\+/gi;

  for (let i = 0; i < ctx.lines.length; i++) {
    const line = ctx.lines[i];
    const match = line.match(sqlPattern);

    if (match) {
      const context = getContext(ctx.lines, i, 10);

      // Check if it uses parameterized queries
      if (isSanitized(context)) {
        continue;
      }

      // Extract variable being concatenated
      const concatMatch = line.match(/\+\s*(\w+)/);
      if (concatMatch) {
        const varName = concatMatch[1];

        // Only flag if it's potentially user input
        if (isUserInput(context, varName)) {
          findings.push({
            rule: {
              id: 'V5.1.1',
              category: 'Input Validation',
              title: 'SQL Injection Risk',
              description: 'User input is concatenated into SQL query without parameterization',
              severity: 'critical',
              pattern: sqlPattern,
              level: 1,
              owaspTop10: ['A03:2021 - Injection'],
            },
            file: ctx.fileName,
            line: i + 1,
            code: line.trim(),
            match: match[0].trim(),
          });
        }
      }
    }
  }

  return findings;
}

// Contextual Command Injection detector
function detectCommandInjection(ctx: CodeContext): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  const cmdPattern = /(exec|system|spawn|shell_exec|passthru|Runtime\.getRuntime\(\)\.exec)\s*\(/gi;

  for (let i = 0; i < ctx.lines.length; i++) {
    const line = ctx.lines[i];
    const match = line.match(cmdPattern);

    if (match) {
      const context = getContext(ctx.lines, i, 10);

      // Check for shell=True or similar unsafe flags
      const hasUnsafeFlag = /shell\s*[=:]\s*true/i.test(context);

      // Check if command uses user input
      const concatMatch = line.match(/\+\s*(\w+)|\$\{(\w+)\}|%s.*%\s*\((\w+)/);

      if (concatMatch) {
        const varName = concatMatch[1] || concatMatch[2] || concatMatch[3];

        if (isUserInput(context, varName) && !isSanitized(context)) {
          findings.push({
            rule: {
              id: 'V5.1.2',
              category: 'Input Validation',
              title: 'Command Injection Risk',
              description: 'User input is used in system command without sanitization',
              severity: 'critical',
              pattern: cmdPattern,
              level: 1,
              owaspTop10: ['A03:2021 - Injection'],
            },
            file: ctx.fileName,
            line: i + 1,
            code: line.trim(),
            match: match[0].trim(),
          });
        }
      }
    }
  }

  return findings;
}

// Contextual XSS detector
function detectXSS(ctx: CodeContext): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  // innerHTML, dangerouslySetInnerHTML
  const xssPattern = /(\.innerHTML|dangerouslySetInnerHTML)\s*=/gi;

  for (let i = 0; i < ctx.lines.length; i++) {
    const line = ctx.lines[i];
    const match = line.match(xssPattern);

    if (match) {
      const context = getContext(ctx.lines, i, 10);

      // Skip if sanitized
      if (isSanitized(context)) {
        continue;
      }

      // Check if the value comes from user input
      const valueMatch = line.match(/=\s*(\w+)/);
      if (valueMatch) {
        const varName = valueMatch[1];

        if (isUserInput(context, varName)) {
          findings.push({
            rule: {
              id: 'V5.3.1',
              category: 'Input Validation',
              title: 'XSS Risk - innerHTML',
              description: 'User input is inserted into DOM without sanitization',
              severity: 'high',
              pattern: xssPattern,
              level: 1,
              owaspTop10: ['A03:2021 - Injection'],
            },
            file: ctx.fileName,
            line: i + 1,
            code: line.trim(),
            match: match[0].trim(),
          });
        }
      }
    }
  }

  return findings;
}

// Contextual hardcoded credentials detector
function detectHardcodedCredentials(ctx: CodeContext): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  // Look for actual credential assignments, not config keys
  const credPattern = /\b(password|passwd|pwd|secret|api[_-]?key|apikey|token)\s*=\s*["']([^"']+)["']/gi;

  for (let i = 0; i < ctx.lines.length; i++) {
    const line = ctx.lines[i];
    let match;

    while ((match = credPattern.exec(line)) !== null) {
      const credName = match[1];
      const credValue = match[2];
      const context = getContext(ctx.lines, i, 5);

      // Skip if it's clearly a config key or route
      if (credValue.includes('.') || credValue.includes('/') ||
          credValue.startsWith('auth') || credValue.startsWith('api') ||
          credValue.length < 6) {
        continue;
      }

      // Skip test/example values
      if (/test|example|demo|placeholder|xxx|your_|<|>|\{|\$/.test(credValue.toLowerCase())) {
        continue;
      }

      // Skip if from environment
      if (/process\.env|os\.getenv|ENV\[/i.test(context)) {
        continue;
      }

      // Skip enum/const definitions (PascalCase or UPPER_CASE identifiers)
      if (/^[A-Z][a-zA-Z0-9_]*\s*=/.test(line)) {
        continue;
      }

      findings.push({
        rule: {
          id: 'V2.1.1',
          category: 'Authentication',
          title: 'Hardcoded Credentials',
          description: 'Credentials should not be hardcoded in source code',
          severity: 'critical',
          pattern: credPattern,
          level: 1,
          owaspTop10: ['A07:2021 - Identification and Authentication Failures'],
        },
        file: ctx.fileName,
        line: i + 1,
        code: line.trim(),
        match: match[0].trim(),
      });
    }
  }

  return findings;
}

// Contextual eval() detector
function detectDangerousEval(ctx: CodeContext): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  // Only match standalone eval(), not method calls like .eval()
  const evalPattern = /(?<!\.)(?<!\w)\beval\s*\(/gi;

  for (let i = 0; i < ctx.lines.length; i++) {
    const line = ctx.lines[i];
    const match = line.match(evalPattern);

    if (match) {
      // Skip if it's a method call (e.g., model.eval() in PyTorch)
      if (/\.\s*eval\s*\(/.test(line)) {
        continue;
      }

      // Skip if it's just eval() with no arguments
      if (/eval\s*\(\s*\)/.test(line)) {
        continue;
      }

      // Skip JSON parsing patterns
      if (/JSON|parse/i.test(line)) {
        continue;
      }

      findings.push({
        rule: {
          id: 'V5.3.3',
          category: 'Input Validation',
          title: 'Dangerous eval() Usage',
          description: 'eval() should never be used as it can execute arbitrary code',
          severity: 'critical',
          pattern: evalPattern,
          level: 1,
          owaspTop10: ['A03:2021 - Injection'],
        },
        file: ctx.fileName,
        line: i + 1,
        code: line.trim(),
        match: match[0].trim(),
      });
    }
  }

  return findings;
}

// Main contextual analysis function
export function performContextualAnalysis(files: FileContent[]): SecurityFinding[] {
  const allFindings: SecurityFinding[] = [];

  for (const file of files) {
    const ctx: CodeContext = {
      fileContent: file.content,
      fileName: file.path,
      lines: file.content.split('\n'),
      language: file.path.split('.').pop()?.toLowerCase() || '',
    };

    // Run contextual detectors
    allFindings.push(...detectSQLInjection(ctx));
    allFindings.push(...detectCommandInjection(ctx));
    allFindings.push(...detectXSS(ctx));
    allFindings.push(...detectHardcodedCredentials(ctx));
    allFindings.push(...detectDangerousEval(ctx));
  }

  return allFindings;
}
