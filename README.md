# Talent Match 🎯

An AI-powered job matching platform that goes beyond traditional keyword matching to create meaningful connections between candidates and opportunities.

## 🚀 Features

- **Smart Job Matching**: Utilizes Google's Gemini AI to understand job descriptions and candidate profiles contextually
- **Skill Gap Analysis**: Visualizes the difference between required and existing skills
- **Interview Question Generator**: Automatically generates relevant interview questions based on missing experience
- **Vector-Based Search**: Implements Pinecone for efficient and semantic search capabilities
- **Interactive UI**: Built with Next.js and Tailwind CSS for a smooth user experience

## 🛠️ Technical Stack

- **Frontend**: Next.js 13.5+, React, Tailwind CSS
- **AI/ML**: 
  - Google Gemini AI for natural language understanding
  - HuggingFace transformers for text processing
  - Pinecone for vector embeddings and semantic search
- **UI Components**: Custom-built components with modern design principles

## 💡 Core Features Explained

### Contextual Understanding
Unlike traditional job matching systems that rely on keyword matching, Talent Match uses advanced AI to understand the context of job requirements. For example, it can differentiate between "5 years Java experience" and more nuanced requirements like "expert-level Java knowledge with microservices architecture experience."

### Skill Gap Analysis
The platform provides visual representations of:
- Required skills vs. candidate's existing skills
- Experience level matches
- Suggested areas for improvement

### Smart Interview Preparation
- Generates customized interview questions based on identified skill gaps
- Provides feedback on potential areas of focus for candidates
- Helps employers frame relevant technical discussion points

## 🔮 Future Improvements

- Sentiment analysis for company culture matching
- Real-time market salary predictions
- Two-way matching system for companies
- Integration with popular ATS systems
- Enhanced analytics and reporting features

## 🎯 Project Goals

1. Make job matching more accurate and meaningful
2. Reduce time spent on initial candidate screening
3. Help candidates identify and bridge skill gaps
4. Provide actionable insights for both employers and job seekers

## 💻 Local Development

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys for Gemini AI and Pinecone

# Run the development server
npm run dev
```

## 📝 Note

This project was built as a demonstration of modern AI capabilities in the recruitment space. It's an experimental project that showcases the potential of AI in understanding and matching job requirements with candidate profiles.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Submit bug reports
- Suggest new features
- Create pull requests
- Share feedback on matching accuracy

## 📜 License

MIT License - Feel free to use this project for learning and development purposes.

# Talent Match

<!-- <p align="center">
  <img src="public/logo.png" alt="Talent Match Logo" width="200"/>
</p> -->

Talent Match is an AI-powered job matching platform that connects employers with the most suitable candidates using advanced AI algorithms and vector embeddings. The application leverages Google's Gemini AI to provide intelligent matching, personalized feedback, and tailored interview questions.

## 🌟 Features

### For Employers
- **Post Job Listings**: Create detailed job descriptions with requirements and qualifications
- **AI-Powered Candidate Matching**: Find the most relevant candidates for your open positions
- **Smart Candidate Evaluation**: Receive AI-generated feedback on candidate suitability
- **Interview Assistance**: Get AI-generated interview questions tailored to each candidate

### For Candidates
- **Profile Creation**: Build a comprehensive profile showcasing skills and experience
- **Resume Upload**: Upload your resume for AI analysis and matching
- **Job Matching**: Get matched with jobs that align with your skills and experience
- **Career Development**: Receive feedback on how to improve your profile for better matches

## 🚀 Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Database**: Pinecone (Vector Database)
- **AI/ML**: Google Gemini AI, HuggingFace Embeddings
- **Deployment**: Nginx, PM2
- **Authentication**: Next-Auth

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (v18 or later)
- npm or yarn
- Pinecone account for vector database
- Google AI API access (Gemini)
- HuggingFace API key for embeddings

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sadiqhasanrupani/talent-match.git
   cd talent-match
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   # API Keys
   GOOGLE_API_KEY=your_google_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key

   # Pinecone Configuration
   DEBUG_PINECONE=true # Set to false in production

   # Next Auth
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000

   # Other Settings
   CANDIDATE_INDEX=candidate-index
   JOB_INDEX=job-index
   ```

4. **Build the application**
   ```bash
   npm run build
   # or
   yarn build
   ```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

### Production Mode

```bash
npm start
# or
yarn start
```

With PM2 (recommended for production):
```bash
pm2 start ecosystem.config.json
```

## 🧭 Usage Guide

### For Employers

1. **Create an account/Log in** using the sign-in options
2. **Post a new job listing** by navigating to "Add Job" and filling out the form
3. **Search for candidates** by clicking on "Search Candidates" and entering your job details
4. **Review matched candidates** sorted by match score
5. **Evaluate candidates** with AI-generated feedback and suggested interview questions

### For Candidates

1. **Create an account/Log in** using the sign-in options
2. **Complete your profile** by navigating to "Add Profile" and filling out the form
3. **Upload your resume** to enhance matching accuracy
4. **Browse job matches** sorted by relevance
5. **Apply to jobs** directly through the platform

## 🚢 Deployment

The application can be deployed using Nginx as a reverse proxy and PM2 for process management.

### Using Nginx and PM2

1. **Set up Nginx configuration**
   ```
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Configure PM2**
   Use the provided ecosystem.config.json file:
   ```json
   {
     "apps": [
       {
         "name": "talent-match",
         "script": "npm",
         "args": "start",
         "interpreter": "none",
         "env": {
           "NODE_ENV": "production"
         }
       }
     ]
   }
   ```

3. **Start the application with PM2**
   ```bash
   pm2 start ecosystem.config.json
   ```

4. **Set up PM2 to start on system boot**
   ```bash
   pm2 save
   pm2 startup
   ```

## 🔄 API Endpoints

### Candidate-related endpoints:
- `POST /api/add-candidate`: Add a new candidate profile
- `GET /api/candidates`: Retrieve all candidates
- `GET /api/candidates/[id]`: Get a specific candidate

### Job-related endpoints:
- `POST /api/add-job`: Add a new job listing
- `GET /api/jobs`: Retrieve all jobs
- `GET /api/jobs/[id]`: Get a specific job

### Matching endpoints:
- `POST /api/search-candidates`: Find candidates matching a job description
- `GET /api/match-candidates/[jobId]`: Get candidates matching a specific job
- `GET /api/match-jobs/[candidateId]`: Get jobs matching a specific candidate

## 🔒 Environment Variables

The following environment variables are required for the application to function properly:

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | API key for Google Gemini AI | Yes |
| `PINECONE_API_KEY` | API key for Pinecone vector database | Yes |
| `HUGGINGFACE_API_KEY` | API key for HuggingFace embeddings | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth authentication | Yes |
| `NEXTAUTH_URL` | URL for NextAuth callbacks | Yes |
| `CANDIDATE_INDEX` | Name of Pinecone index for candidates | Yes |
| `JOB_INDEX` | Name of Pinecone index for jobs | Yes |
| `DEBUG_PINECONE` | Enable debugging for Pinecone connections | No |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.
