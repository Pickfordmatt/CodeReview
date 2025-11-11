'use client';

import { AnalysisResult } from '@/lib/code-analyzer';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, Download } from 'lucide-react';
import { useState } from 'react';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onDownloadReport: () => void;
  onDownloadCSV: () => void;
}

export default function AnalysisResults({ result, onDownloadReport, onDownloadCSV }: AnalysisResultsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (key: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCategories(newExpanded);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700';
    }
  };

  // Group findings by category and severity
  const groupedFindings = result.findings.reduce((acc, finding) => {
    const key = `${finding.rule.severity}|${finding.rule.category}`;
    if (!acc[key]) {
      acc[key] = {
        severity: finding.rule.severity,
        category: finding.rule.category,
        findings: []
      };
    }
    acc[key].findings.push(finding);
    return acc;
  }, {} as Record<string, { severity: string; category: string; findings: typeof result.findings }>);

  // Sort groups by severity (critical -> high -> medium -> low)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedGroups = Object.entries(groupedFindings).sort((a, b) => {
    const severityDiff = severityOrder[a[1].severity as keyof typeof severityOrder] - severityOrder[b[1].severity as keyof typeof severityOrder];
    if (severityDiff !== 0) return severityDiff;
    return a[1].category.localeCompare(b[1].category);
  });

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Security Analysis Report</h2>
          <div className="flex space-x-2">
            <button
              onClick={onDownloadCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onDownloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Files Analyzed</p>
            <p className="text-2xl font-bold">{result.totalFiles}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Findings</p>
            <p className="text-2xl font-bold">{result.totalFindings}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
            <p className="text-2xl font-bold">{Object.keys(result.categoryCounts).length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">ASVS Standard</p>
            <p className="text-2xl font-bold">4.0</p>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-3">Severity Breakdown</h3>
          <div className="space-y-2">
            {result.severityCounts.critical > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Critical</span>
                </div>
                <span className="font-bold text-red-600">{result.severityCounts.critical}</span>
              </div>
            )}
            {result.severityCounts.high > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">High</span>
                </div>
                <span className="font-bold text-orange-600">{result.severityCounts.high}</span>
              </div>
            )}
            {result.severityCounts.medium > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Medium</span>
                </div>
                <span className="font-bold text-yellow-600">{result.severityCounts.medium}</span>
              </div>
            )}
            {result.severityCounts.low > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Low</span>
                </div>
                <span className="font-bold text-blue-600">{result.severityCounts.low}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Findings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Detailed Findings</h3>

        {result.totalFindings === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">No security issues found!</p>
            <p className="text-sm">Your code passed the ASVS security review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedGroups.map(([key, group]) => (
              <div key={key} className={`border rounded-lg overflow-hidden ${getSeverityColor(group.severity)}`}>
                <button
                  onClick={() => toggleCategory(key)}
                  className="w-full text-left p-4 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(group.severity)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg uppercase">{group.severity}</span>
                          <span className="text-gray-600 dark:text-gray-300">•</span>
                          <span className="font-semibold">{group.category}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {group.findings.length} {group.findings.length === 1 ? 'finding' : 'findings'}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl text-gray-500">
                      {expandedCategories.has(key) ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {expandedCategories.has(key) && (
                  <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                    {group.findings.map((finding, index) => (
                      <div
                        key={index}
                        className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-mono text-sm font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                {finding.rule.id}
                              </span>
                              <span className="font-semibold text-lg">{finding.rule.title}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {finding.rule.description}
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">File:</span>
                                <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                  {finding.file}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Line:</span>
                                <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                  {finding.line}
                                </span>
                              </div>
                              <div className="mt-3">
                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Code:</p>
                                <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto border border-gray-700">
                                  {finding.code}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
