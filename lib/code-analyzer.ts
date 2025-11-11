import { SecurityRule, SecurityFinding } from './asvs-rules';
import { performContextualAnalysis } from './contextual-analyzer';

export interface LanguageStats {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface FrameworkInfo {
  name: string;
  confidence: 'high' | 'medium' | 'low';
}

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
  languageStats: LanguageStats[];
  frameworks: FrameworkInfo[];
  totalLines: number;
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

const LANGUAGE_MAP: Record<string, string> = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.vue': 'Vue',
  '.py': 'Python',
  '.java': 'Java',
  '.cs': 'C#',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.go': 'Go',
  '.rs': 'Rust',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.scala': 'Scala',
  '.cpp': 'C++',
  '.c': 'C',
  '.h': 'C/C++',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.ps1': 'PowerShell',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.json': 'JSON',
  '.xml': 'XML',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'Sass',
  '.less': 'Less'
};

export function isCodeFile(filename: string): boolean {
  const ext = filename.toLowerCase();
  return CODE_FILE_EXTENSIONS.some(extension => ext.endsWith(extension));
}

export function getLanguageFromFile(filename: string): string {
  const ext = filename.toLowerCase().match(/\.\w+$/)?.[0] || '';
  return LANGUAGE_MAP[ext] || 'Other';
}

export function detectFrameworks(files: FileContent[]): FrameworkInfo[] {
  const frameworks: FrameworkInfo[] = [];
  const frameworkPatterns = {
    'React': { files: ['package.json'], patterns: [/"react":/] },
    'Next.js': { files: ['next.config.js', 'next.config.mjs', 'next.config.ts'], patterns: [/"next":/] },
    'Vue.js': { files: ['package.json'], patterns: [/"vue":/] },
    'Angular': { files: ['angular.json', 'package.json'], patterns: [/"@angular\/core":/] },
    'Svelte': { files: ['package.json'], patterns: [/"svelte":/] },
    'Django': { files: ['manage.py', 'settings.py'], patterns: [/django/, /DJANGO_SETTINGS_MODULE/] },
    'Flask': { files: [], patterns: [/from flask import/, /Flask\(__name__\)/] },
    'Express': { files: ['package.json'], patterns: [/"express":/, /require\(['"]express['"]\)/, /from ['"]express['"]/] },
    'Spring': { files: ['pom.xml', 'build.gradle'], patterns: [/org\.springframework/, /@SpringBootApplication/] },
    'Laravel': { files: ['artisan', 'composer.json'], patterns: [/"laravel\/framework":/] },
    'Ruby on Rails': { files: ['Gemfile'], patterns: [/gem ['"]rails['"]/, /Rails\.application/] },
    'ASP.NET': { files: [], patterns: [/using System\.Web/, /using Microsoft\.AspNetCore/] },
    'FastAPI': { files: [], patterns: [/from fastapi import/, /FastAPI\(/] },
    'Tailwind CSS': { files: ['tailwind.config.js', 'tailwind.config.ts'], patterns: [/"tailwindcss":/] },
    'Bootstrap': { files: [], patterns: [/"bootstrap":/, /<link.*bootstrap/] },
  };

  const fileMap = new Map(files.map(f => [f.path.split('/').pop() || '', f]));
  const allContent = files.map(f => f.content).join('\n');

  for (const [name, { files: configFiles, patterns }] of Object.entries(frameworkPatterns)) {
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let detected = false;

    // Check for config files (high confidence)
    for (const configFile of configFiles) {
      if (fileMap.has(configFile)) {
        detected = true;
        confidence = 'high';
        break;
      }
    }

    // Check for patterns in code
    if (!detected) {
      for (const pattern of patterns) {
        if (pattern.test(allContent)) {
          detected = true;
          confidence = patterns.length > 1 ? 'medium' : 'low';
          break;
        }
      }
    }

    if (detected) {
      frameworks.push({ name, confidence });
    }
  }

  return frameworks.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
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

  // Calculate language statistics
  const languageData: Record<string, { files: number; lines: number }> = {};
  let totalLines = 0;

  for (const file of codeFiles) {
    const language = getLanguageFromFile(file.path);
    const lines = file.content.split('\n');
    const lineCount = lines.length;

    if (!languageData[language]) {
      languageData[language] = { files: 0, lines: 0 };
    }
    languageData[language].files++;
    languageData[language].lines += lineCount;
    totalLines += lineCount;
  }

  // Perform contextual analysis (checks across multiple lines with context awareness)
  const contextualFindings = performContextualAnalysis(codeFiles);
  findings.push(...contextualFindings);

  // Also run traditional pattern-based analysis for other rules
  const criticalRuleIds = ['V5.1.1', 'V5.1.2', 'V5.3.1', 'V5.3.3', 'V2.1.1'];
  const nonContextualRules = rules.filter(rule => !criticalRuleIds.includes(rule.id));

  for (const file of codeFiles) {
    const lines = file.content.split('\n');

    for (const rule of nonContextualRules) {
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
          }
        }
      }
    }
  }

  // Update counts
  for (const finding of findings) {
    severityCounts[finding.rule.severity]++;
    categoryCounts[finding.rule.category] = (categoryCounts[finding.rule.category] || 0) + 1;
  }

  // Convert language data to stats with percentages
  const languageStats: LanguageStats[] = Object.entries(languageData)
    .map(([language, data]) => ({
      language,
      files: data.files,
      lines: data.lines,
      percentage: totalLines > 0 ? (data.lines / totalLines) * 100 : 0,
    }))
    .sort((a, b) => b.lines - a.lines);

  // Detect frameworks
  const frameworks = detectFrameworks(files);

  return {
    totalFiles: codeFiles.length,
    totalFindings: findings.length,
    findings: findings.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.rule.severity] - severityOrder[b.rule.severity];
    }),
    severityCounts,
    categoryCounts,
    languageStats,
    frameworks,
    totalLines,
  };
}

export function generateReport(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push('# ASVS Security Code Review Report\n');
  lines.push(`**Total Files Analyzed:** ${result.totalFiles}`);
  lines.push(`**Total Lines of Code:** ${result.totalLines.toLocaleString()}`);
  lines.push(`**Total Findings:** ${result.totalFindings}\n`);

  // Language breakdown
  lines.push('## Language Breakdown');
  for (const stat of result.languageStats) {
    lines.push(`- ${stat.language}: ${stat.percentage.toFixed(1)}% (${stat.files} files, ${stat.lines.toLocaleString()} lines)`);
  }
  lines.push('');

  // Frameworks detected
  if (result.frameworks.length > 0) {
    lines.push('## Frameworks & Libraries Detected');
    for (const framework of result.frameworks) {
      lines.push(`- ${framework.name} (${framework.confidence} confidence)`);
    }
    lines.push('');
  }

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

  // Group by severity and category
  const groupedByType: Record<string, { severity: string; category: string; findings: SecurityFinding[] }> = {};
  for (const finding of result.findings) {
    const key = `${finding.rule.severity}|${finding.rule.category}`;
    if (!groupedByType[key]) {
      groupedByType[key] = {
        severity: finding.rule.severity,
        category: finding.rule.category,
        findings: []
      };
    }
    groupedByType[key].findings.push(finding);
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedGroups = Object.entries(groupedByType).sort((a, b) => {
    const severityDiff = severityOrder[a[1].severity as keyof typeof severityOrder] - severityOrder[b[1].severity as keyof typeof severityOrder];
    if (severityDiff !== 0) return severityDiff;
    return a[1].category.localeCompare(b[1].category);
  });

  for (const [, group] of sortedGroups) {
    lines.push(`### [${group.severity.toUpperCase()}] ${group.category}`);
    lines.push(`**${group.findings.length} finding${group.findings.length !== 1 ? 's' : ''}**\n`);

    for (const finding of group.findings) {
      lines.push(`#### ${finding.rule.id}: ${finding.rule.title}`);
      lines.push(`- **Description:** ${finding.rule.description}`);
      lines.push(`- **File:** \`${finding.file}\``);
      lines.push(`- **Line:** ${finding.line}`);
      lines.push(`- **Code:** \`${finding.code}\`\n`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
