import { SecurityRule, SecurityFinding } from './asvs-rules';

export interface AnalysisResult {
  totalFiles: number;
  totalFindings: number;
  findings: SecurityFinding[];
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryCounts: Record<string, number>;
}

export interface FileContent {
  path: string;
  content: string;
}

const CODE_FILE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.py', '.java', '.cs', '.php',
  '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.cpp', '.c', '.h',
  '.sql', '.sh', '.bash', '.ps1', '.yaml', '.yml', '.json', '.xml',
  '.html', '.css', '.scss', '.sass', '.less'
];

export function isCodeFile(filename: string): boolean {
  const ext = filename.toLowerCase();
  return CODE_FILE_EXTENSIONS.some(extension => ext.endsWith(extension));
}

export function analyzeCode(
  files: FileContent[],
  rules: SecurityRule[]
): AnalysisResult {
  const findings: SecurityFinding[] = [];
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const categoryCounts: Record<string, number> = {};

  // Filter to only code files
  const codeFiles = files.filter(file => isCodeFile(file.path));

  for (const file of codeFiles) {
    const lines = file.content.split('\n');

    for (const rule of rules) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(rule.pattern);

        if (matches) {
          for (const match of matches) {
            findings.push({
              rule,
              file: file.path,
              line: i + 1,
              code: line.trim(),
              match: match.trim(),
            });

            severityCounts[rule.severity]++;
            categoryCounts[rule.category] = (categoryCounts[rule.category] || 0) + 1;
          }
        }
      }
    }
  }

  return {
    totalFiles: codeFiles.length,
    totalFindings: findings.length,
    findings: findings.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.rule.severity] - severityOrder[b.rule.severity];
    }),
    severityCounts,
    categoryCounts,
  };
}

export function generateReport(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push('# ASVS Security Code Review Report\n');
  lines.push(`**Total Files Analyzed:** ${result.totalFiles}`);
  lines.push(`**Total Findings:** ${result.totalFindings}\n`);

  lines.push('## Severity Summary');
  lines.push(`- Critical: ${result.severityCounts.critical}`);
  lines.push(`- High: ${result.severityCounts.high}`);
  lines.push(`- Medium: ${result.severityCounts.medium}`);
  lines.push(`- Low: ${result.severityCounts.low}\n`);

  lines.push('## Category Summary');
  for (const [category, count] of Object.entries(result.categoryCounts)) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push('');

  lines.push('## Detailed Findings\n');

  const groupedByFile: Record<string, SecurityFinding[]> = {};
  for (const finding of result.findings) {
    if (!groupedByFile[finding.file]) {
      groupedByFile[finding.file] = [];
    }
    groupedByFile[finding.file].push(finding);
  }

  for (const [file, findings] of Object.entries(groupedByFile)) {
    lines.push(`### ${file}\n`);
    for (const finding of findings) {
      lines.push(`**[${finding.rule.severity.toUpperCase()}] ${finding.rule.id}: ${finding.rule.title}**`);
      lines.push(`- Line ${finding.line}`);
      lines.push(`- Description: ${finding.rule.description}`);
      lines.push(`- Code: \`${finding.code}\``);
      lines.push(`- Match: \`${finding.match}\`\n`);
    }
  }

  return lines.join('\n');
}
