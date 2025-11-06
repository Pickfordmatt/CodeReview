import JSZip from 'jszip';
import { FileContent } from './code-analyzer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const MAX_FILES = 1000; // Maximum number of files to process

export interface ProcessingStats {
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  totalSize: number;
  errors: string[];
}

export async function processZipFile(file: File): Promise<{
  files: FileContent[];
  stats: ProcessingStats;
}> {
  const stats: ProcessingStats = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    totalSize: 0,
    errors: [],
  };

  if (file.size > MAX_TOTAL_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_TOTAL_SIZE / (1024 * 1024)}MB`);
  }

  const files: FileContent[] = [];

  try {
    const zip = await JSZip.loadAsync(file);
    const zipFiles = Object.values(zip.files);
    stats.totalFiles = zipFiles.length;

    if (stats.totalFiles > MAX_FILES) {
      throw new Error(`Archive contains too many files (${stats.totalFiles}). Maximum allowed: ${MAX_FILES}`);
    }

    for (const zipEntry of zipFiles) {
      // Skip directories
      if (zipEntry.dir) {
        continue;
      }

      // Skip hidden files and system files
      if (zipEntry.name.includes('/.') || zipEntry.name.startsWith('.')) {
        stats.skippedFiles++;
        continue;
      }

      // Skip node_modules and common build directories
      if (
        zipEntry.name.includes('node_modules/') ||
        zipEntry.name.includes('dist/') ||
        zipEntry.name.includes('build/') ||
        zipEntry.name.includes('.git/') ||
        zipEntry.name.includes('vendor/') ||
        zipEntry.name.includes('venv/')
      ) {
        stats.skippedFiles++;
        continue;
      }

      try {
        const content = await zipEntry.async('text');
        const size = new Blob([content]).size;

        if (size > MAX_FILE_SIZE) {
          stats.errors.push(`File ${zipEntry.name} exceeds maximum size (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
          stats.skippedFiles++;
          continue;
        }

        stats.totalSize += size;

        files.push({
          path: zipEntry.name,
          content,
        });

        stats.processedFiles++;
      } catch (error) {
        stats.errors.push(`Error processing ${zipEntry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        stats.skippedFiles++;
      }
    }

    return { files, stats };
  } catch (error) {
    throw new Error(`Failed to process zip file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
