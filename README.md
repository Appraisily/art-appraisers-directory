# WordPress to Hugo Content Migration Service

## Overview
This service automates the process of migrating WordPress posts to Hugo markdown files. It reads WordPress post IDs from a Google Sheets document, retrieves the content via the WordPress REST API, and converts it to Hugo-compatible markdown files with proper front matter.

## Core Features

### 1. Google Sheets Integration
- Reads WordPress post IDs from a specified Google Sheet
- Tracks processing status
- Uses Google Cloud's application default credentials

### 2. WordPress Integration
- Fetches post content using WordPress REST API
- Retrieves post metadata and featured images
- Preserves SEO settings and taxonomies

### 3. Hugo Content Generation
- Converts WordPress HTML to clean markdown
- Generates proper Hugo front matter
- Maintains image references and internal links
- Preserves categories and tags
- Creates organized content structure

## Architecture

### Project Structure
```
src/
├── controllers/          # Request handlers
│   └── worker.controller.js
├── services/            # Core business logic
│   ├── content/         # Content processing
│   │   └── content.service.js
│   ├── wordpress/       # WordPress integration
│   │   ├── client.js
│   │   └── post.service.js
│   ├── hugo.service.js  # Hugo integration
│   └── sheets.service.js
├── utils/              # Utility functions
│   ├── secrets.js
│   ├── storage.js
│   └── sheets.js
└── config/            # Configuration
    └── index.js
```

## API Endpoints

### Content Processing
```bash
# Process WordPress posts from sheets
POST /api/process

# Get WordPress posts with pagination
GET /api/wordpress/posts?page=1&perPage=10
```

## Deployment

### Cloud Run Configuration
- Memory: 1GB per instance
- CPU: 1 core per instance
- Auto-scaling: 1-10 instances
- Region: us-central1
- Platform: managed
- Authentication: public access

### CI/CD Pipeline
- GitHub Actions workflow for automated deployment
- Cloud Build configuration for manual deployments
- Zero-downtime deployments

## Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `PROJECT_ID` | Google Cloud project ID | Yes |
| `PORT` | Server port | No (default: 8080) |

### Required Secrets
| Secret Name | Description |
|-------------|-------------|
| `SHEETS_ID_SEO` | Google Sheets document ID |
| `WORDPRESS_API_URL` | WordPress API URL |
| `wp_username` | WordPress username |
| `wp_app_password` | WordPress application password |
| `service-account-json` | Google service account credentials |

## Development

### Prerequisites
- Node.js 18+
- Google Cloud SDK
- Access to required Google Cloud services
- WordPress site with REST API access
- Hugo (for local development)

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run locally: `npm start`

### Health Check
```bash
GET /health
```
Returns:
```json
{
  "status": "ok",
  "services": {
    "sheets": "connected",
    "wordpress": "connected",
    "storage": "connected"
  }
}
```

## Error Handling
- Comprehensive error logging
- Automatic retry mechanisms
- Detailed error reporting

## Storage
Content and logs are stored in Google Cloud Storage:
```
images_free_reports/
├── seo/
│   ├── posts/
│   │   └── {post-id}/
│   │       ├── original.json
│   │       └── markdown.json
│   └── logs/
│       └── {date}/
│           └── errors.json
```

## Hugo Content Structure
```
content/
├── _index.md          # Main landing page
└── blog/              # Blog posts directory
    ├── _index.md      # Blog listing page
    └── posts/         # Individual posts
        └── [slug].md  # Generated post files
```

## Limitations
- WordPress API rate limits
- Google Sheets API limits
- Storage capacity constraints