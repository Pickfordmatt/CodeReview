# ASVS Code Security Reviewer

A Next.js web application that performs automated security code reviews based on the OWASP Application Security Verification Standard (ASVS) 4.0.

## Features

- Upload ZIP archives containing source code
- Automated security analysis based on ASVS standards
- Detection of common vulnerabilities including:
  - Hardcoded credentials
  - SQL injection risks
  - Command injection vulnerabilities
  - XSS vulnerabilities
  - Weak cryptographic algorithms
  - Insecure session management
  - Path traversal issues
  - CORS misconfigurations
  - And many more...
- Severity classification (Critical, High, Medium, Low)
- Detailed reports with line numbers and code snippets
- Downloadable Markdown reports
- Dark mode support

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **JSZip** - Client-side ZIP file processing
- **Lucide React** - Icon library
- **Cloudflare Pages** - Deployment platform

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CodeReview
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

### Local Build

```bash
npm run build
```

This creates an optimized static export in the `out` directory.

### Deploy to Cloudflare Pages

#### Option 1: Using Wrangler CLI

1. Install Wrangler globally (if not already installed):
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Build for Cloudflare Pages:
```bash
npm run pages:build
```

4. Deploy:
```bash
npm run deploy
```

#### Option 2: Using Cloudflare Dashboard

1. Build the project:
```bash
npm run build
```

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Navigate to Pages
4. Click "Create a project"
5. Connect your Git repository or upload the `out` folder directly
6. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `out`
   - Node version: 18 or higher

#### Option 3: GitHub Integration

1. Push your code to GitHub
2. In Cloudflare Pages, connect your GitHub repository
3. Set build configuration:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output directory: `out`
4. Cloudflare will automatically build and deploy on every push

## Usage

1. **Upload Code**: Click the upload area or drag and drop a ZIP file containing your source code
2. **Analysis**: The application will automatically extract and analyze all code files
3. **Review Results**: View findings organized by severity and file
4. **Download Report**: Export results as a Markdown file for sharing or documentation

## File Size Limits

- Maximum ZIP file size: 50MB
- Maximum individual file size: 10MB
- Maximum number of files: 1,000
- Automatically skips: `node_modules`, `dist`, `build`, `.git`, `vendor`, `venv`

## ASVS Coverage

This tool implements checks based on OWASP ASVS 4.0 covering:

- **V2**: Authentication
- **V3**: Session Management
- **V5**: Input Validation and Output Encoding
- **V6**: Stored Cryptography
- **V7**: Error Handling and Logging
- **V8**: Data Protection
- **V9**: Communications
- **V10**: Malicious Code
- **V12**: Files and Resources
- **V13**: API and Web Service
- **V14**: Configuration

## Limitations

- This tool performs static analysis only
- May produce false positives
- Does not replace manual security audits
- Best used as a first-pass screening tool
- Should be combined with dynamic testing and penetration testing

## Security Considerations

- All processing happens client-side in the browser
- No code is uploaded to any server
- No data is stored or transmitted
- Completely private and secure

## Development

### Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── AnalysisResults.tsx
│   └── FileUpload.tsx
├── lib/                   # Core logic
│   ├── asvs-rules.ts      # Security rules database
│   ├── code-analyzer.ts   # Analysis engine
│   └── zip-processor.ts   # ZIP file handler
├── next.config.mjs        # Next.js configuration
├── package.json           # Dependencies
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

### Adding New Security Rules

Edit [lib/asvs-rules.ts](lib/asvs-rules.ts) and add new rules to the `asvsRules` array:

```typescript
{
  id: 'V2.1.X',
  category: 'Authentication',
  title: 'Rule Title',
  description: 'Rule description',
  severity: 'high',
  pattern: /regex-pattern/gi,
  level: 1,
}
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Based on [OWASP ASVS 4.0](https://owasp.org/www-project-application-security-verification-standard/)
- Built with [Next.js](https://nextjs.org/)
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/)

## Disclaimer

This tool is provided as-is for educational and screening purposes. It should not be considered a replacement for professional security audits or penetration testing. Always conduct thorough security reviews of your applications.
