'use client';

import { LanguageStats, FrameworkInfo } from '@/lib/code-analyzer';
import { Code2, Layers } from 'lucide-react';

interface CodeMetricsProps {
  languageStats: LanguageStats[];
  frameworks: FrameworkInfo[];
  totalLines: number;
}

const LANGUAGE_COLORS: Record<string, string> = {
  'TypeScript': '#3178c6',
  'JavaScript': '#f7df1e',
  'Python': '#3776ab',
  'Java': '#b07219',
  'C#': '#178600',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'Swift': '#ffac45',
  'Kotlin': '#A97BFF',
  'C++': '#f34b7d',
  'C': '#555555',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'SCSS': '#c6538c',
  'Shell': '#89e051',
  'SQL': '#e38c00',
  'Vue': '#42b883',
  'Other': '#858585'
};

export default function CodeMetrics({ languageStats, frameworks, totalLines }: CodeMetricsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Code2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Code Metrics</h2>
      </div>

      {/* Language Breakdown Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Language Breakdown</h3>
          <span className="text-sm text-gray-500">{totalLines.toLocaleString()} total lines</span>
        </div>

        {/* Visual Bar */}
        <div className="h-8 rounded-full overflow-hidden flex mb-4 border border-gray-200 dark:border-gray-700">
          {languageStats.map((stat, index) => (
            <div
              key={stat.language}
              className="relative group transition-all hover:opacity-80"
              style={{
                width: `${stat.percentage}%`,
                backgroundColor: LANGUAGE_COLORS[stat.language] || LANGUAGE_COLORS['Other'],
              }}
              title={`${stat.language}: ${stat.percentage.toFixed(1)}%`}
            >
              {stat.percentage > 5 && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold mix-blend-difference">
                  {stat.percentage.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {languageStats.map((stat) => (
            <div key={stat.language} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: LANGUAGE_COLORS[stat.language] || LANGUAGE_COLORS['Other'] }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{stat.language}</div>
                <div className="text-xs text-gray-500">
                  {stat.percentage.toFixed(1)}% • {stat.files} file{stat.files !== 1 ? 's' : ''} • {stat.lines.toLocaleString()} lines
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frameworks Detected */}
      {frameworks.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Frameworks & Libraries Detected</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {frameworks.map((framework) => (
              <div
                key={framework.name}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  framework.confidence === 'high'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : framework.confidence === 'medium'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
                title={`Confidence: ${framework.confidence}`}
              >
                {framework.name}
                {framework.confidence === 'high' && ' ✓'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
