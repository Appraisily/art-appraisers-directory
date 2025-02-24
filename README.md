# Art Appraiser Directory Service

## Overview
This service creates and maintains a comprehensive directory of art appraisers across major US cities. It uses AI-powered data collection and processing to ensure accurate, structured information about art appraisal services.

## Core Features

### 1. Data Collection & Processing
- Gathers detailed art appraiser information using Perplexity AI
- Processes raw data into structured JSON format using OpenAI
- Supports both single-city and batch processing
- Intelligent data deduplication and skip logic

### 2. Dual Storage Architecture
#### City-Specific Storage (`cities/`)
- Structured by city name
- Maintains full metadata and processing history
- Stores both raw and processed data
- Includes timestamps and processing details

#### Global Storage (`Global/`)
- Flat structure with city-named files
- Contains only processed, structured data
- Optimized for quick access and integration
- Direct JSON format without metadata wrapper

### 3. API Endpoints

#### Data Processing
```bash
# Process a single city
POST /api/art-appraiser/process-structured-data/:city/:state

# Process all cities
POST /api/art-appraiser/process-structured-data

# Process raw city data
POST /api/art-appraiser/process-cities
```

#### Data Retrieval
```bash
# Get city data
GET /api/art-appraiser/:state/:city

# List cities in state
GET /api/art-appraiser/state/:state

# Search cities
GET /api/art-appraiser/search
```

### 4. Data Structure
Each appraiser entry includes:
- Name and business details
- Specialties and expertise
- Contact information
- Years in business
- Certifications
- Service areas
- Pricing information

## Services Integration

### 1. Perplexity AI
- Used for initial data gathering
- Provides comprehensive city-specific information
- Real-time data updates and verification

### 2. OpenAI
- Structures raw data into consistent JSON format
- Ensures data quality and completeness
- Validates structured output

### 3. Google Cloud Storage
- Secure data storage and retrieval
- Automatic versioning and backup
- High availability and scalability

## Development

### Prerequisites
- Node.js 18+
- Google Cloud SDK
- Access to required API keys:
  - OpenAI API key
  - Perplexity API key
- Google Cloud Storage bucket access

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `PROJECT_ID` | Google Cloud project ID | Yes |
| `PORT` | Server port (default: 8080) | No |

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run locally: `npm start`

## API Response Format

### Successful Response
```json
{
  "success": true,
  "data": {
    "appraisers": [
      {
        "name": "Example Appraisers",
        "specialties": ["Fine Art", "Antiques"],
        "pricing": ["$350/hour", "$2,500/day"],
        "services_offered": ["Insurance", "Estate"],
        "certifications": ["ASA", "USPAP"],
        "years_in_business": 25,
        "city": "New York",
        "state": "NY",
        "phone": "212-555-0123",
        "website": "www.example.com",
        "notes": "Additional details"
      }
    ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

## Health Check
```bash
GET /health
```
Returns:
```json
{
  "status": "ok",
  "services": {
    "storage": "connected",
    "perplexity": "connected",
    "openai": "connected"
  }
}
```