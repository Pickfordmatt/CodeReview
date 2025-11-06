'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AnalysisResults from '@/components/AnalysisResults';
import { processZipFile, formatFileSize } from '@/lib/zip-processor';
import { analyzeCode, generateReport, AnalysisResult } from '@/lib/code-analyzer';
import { asvsRules } from '@/lib/asvs-rules';
import { Shield, Loader2 } from 'lucide-react';

type AnalysisState = 'idle' | 'processing' | 'complete' | 'error';

export default function Home() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    setState('processing');
    setProgress('Extracting files from archive...');
    setError('');
    setResult(null);

    try {
      // Process the zip file
      const { files, stats } = await processZipFile(file);

      setProgress(`Extracted ${stats.processedFiles} files (${formatFileSize(stats.totalSize)}). Analyzing code...`);

      // Wait a bit to show the message
      await new Promise(resolve => setTimeout(resolve, 500));

      // Analyze the code
      const analysisResult = analyzeCode(files, asvsRules);

      setProgress('Analysis complete!');
      setResult(analysisResult);
      setState('complete');

      // Show any processing errors
      if (stats.errors.length > 0) {
        console.warn('Processing warnings:', stats.errors);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setState('error');
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const report = generateReport(result);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asvs-security-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setState('idle');
    setProgress('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">ASVS Code Security Reviewer</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Automated security code review based on OWASP ASVS 4.0 standards
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload a ZIP archive of your source code for comprehensive security analysis
          </p>
        </div>

        {/* Main Content */}
        {state === 'idle' && (
          <div className="max-w-3xl mx-auto">
            <FileUpload onFileSelect={handleFileSelect} />

            {/* Info Section */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">What we check:</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">Authentication & Session</h3>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Hardcoded credentials</li>
                    <li>• Weak password requirements</li>
                    <li>• Insecure cookie configuration</li>
                    <li>• Session management issues</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">Input Validation</h3>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• SQL injection vulnerabilities</li>
                    <li>• Command injection risks</li>
                    <li>• Path traversal issues</li>
                    <li>• XSS vulnerabilities</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">Cryptography</h3>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Weak algorithms (MD5, SHA1)</li>
                    <li>• Hardcoded encryption keys</li>
                    <li>• Insecure random generation</li>
                    <li>• Cryptographic misuse</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">Data Protection & API</h3>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Sensitive data exposure</li>
                    <li>• Insecure communications</li>
                    <li>• CORS misconfiguration</li>
                    <li>• API security issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Analyzing Your Code</h2>
              <p className="text-gray-600 dark:text-gray-400">{progress}</p>
              <div className="mt-6 bg-blue-50 dark:bg-blue-950 rounded p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  This may take a few moments depending on the size of your codebase...
                </p>
              </div>
            </div>
          </div>
        )}

        {state === 'complete' && result && (
          <div>
            <div className="mb-6 text-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Analyze Another Project
              </button>
            </div>
            <AnalysisResults result={result} onDownloadReport={handleDownloadReport} />
          </div>
        )}

        {state === 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-950 border-2 border-red-300 dark:border-red-800 rounded-lg p-8 text-center">
              <div className="text-red-600 text-6xl mb-4">⚠</div>
              <h2 className="text-2xl font-bold mb-2 text-red-800 dark:text-red-300">Error</h2>
              <p className="text-red-700 dark:text-red-400 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Based on OWASP Application Security Verification Standard (ASVS) 4.0</p>
          <p className="mt-2">
            This tool performs static analysis and may not catch all security issues.
            Always conduct thorough security testing and code review.
          </p>
        </div>
      </div>
    </div>
  );
}
