'use client';

import { AnalysisResult } from '@/lib/code-analyzer';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, Download } from 'lucide-react';
import { useState } from 'react';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onDownloadReport: () => void;
}

export default function AnalysisResults({ result, onDownloadReport }: AnalysisResultsProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (file: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(file)) {
      newExpanded.delete(file);
    } else {
      newExpanded.add(file);
    }
    setExpandedFiles(newExpanded);
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

  // Group findings by file
  const groupedFindings = result.findings.reduce((acc, finding) => {
    if (!acc[finding.file]) {
      acc[finding.file] = [];
    }
    acc[finding.file].push(finding);
    return acc;
  }, {} as Record<string, typeof result.findings>);

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Security Analysis Report</h2>
          <button
            onClick={onDownloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
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
            {Object.entries(groupedFindings).map(([file, findings]) => (
              <div key={file} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFile(file)}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-medium">{file}</span>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                        {findings.length} {findings.length === 1 ? 'issue' : 'issues'}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {expandedFiles.has(file) ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {expandedFiles.has(file) && (
                  <div className="p-4 space-y-4">
                    {findings.map((finding, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${getSeverityColor(finding.rule.severity)}`}
                      >
                        <div className="flex items-start space-x-3 mb-2">
                          {getSeverityIcon(finding.rule.severity)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-mono text-sm font-medium">{finding.rule.id}</span>
                              <span className="font-semibold">{finding.rule.title}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {finding.rule.description}
                            </p>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Line:</span> {finding.line}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Category:</span> {finding.rule.category}
                              </p>
                              <div className="mt-2">
                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Code:</p>
                                <pre className="bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-x-auto">
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
