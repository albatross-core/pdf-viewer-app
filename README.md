# PDF Viewer App

A standalone PDF browser application that connects to AWS S3 to browse and view PDF files with a modern React interface.

![PDF Viewer App Screenshot](.github/assets/screenshot.png)

## Features

- 📁 Browse PDF files from S3 buckets
- 🔍 Search and filter files by name or path
- 📄 Inline PDF preview with interactive viewer
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Built with Bun for fast development and runtime

## Quick Start

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

3. **Start development server**
   ```bash
   bun run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for S3 bucket | `eu-central-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | Required |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | Required |

### S3 Bucket

The app is configured to use the `alba-admin` S3 bucket by default. To change this, edit the bucket name in:
- `src/index.tsx` (lines 336 and 365)

## Project Structure

```
pdf-viewer-app/
├── src/
│   ├── fe/                    # Frontend components
│   │   ├── App.tsx           # Main app component
│   │   ├── PDFBrowser.tsx    # PDF browser component
│   │   ├── frontend.tsx      # React entry point
│   │   ├── index.html        # HTML template
│   │   └── tailwind-compiled.css
│   ├── service/
│   │   └── s3.ts            # S3 service functions
│   └── index.tsx            # Bun server entry point
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

- `GET /api/file/list?prefix=<path>` - List PDF files in S3 bucket
- `GET /api/file/get?key=<file-key>` - Stream PDF file content

## Development Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run typecheck` - Run TypeScript type checking

## Features in Detail

### PDF Browser
- Lists all PDF files from the configured S3 bucket
- Supports prefix-based filtering (folder navigation)
- Real-time search across file names and paths
- File metadata display (size, last modified date)

### PDF Viewer
- Inline PDF preview using browser's native PDF viewer
- "Open in new tab" functionality for full-screen viewing
- Responsive layout that works on desktop and mobile

### Search & Filter
- Client-side search by filename or full path
- Server-side prefix filtering for S3 folder navigation
- Combined search and filter with reset functionality

## Technology Stack

- **Runtime**: Bun
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AWS**: AWS SDK v3 for S3 operations
- **Server**: Bun's built-in HTTP server

## License

Private project for Albatross.