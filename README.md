# SmartNotes - AI-Powered Note Taking

Transform spoken content into well-structured notes and mindmaps. Support for live audio, YouTube videos, and uploaded media files.

## Features

- 🎤 **Live Audio Recording** - Record and transcribe audio in real-time
- 📺 **YouTube Integration** - Extract transcripts from YouTube videos
- 📁 **File Upload** - Upload audio/video files for transcription
- 🧠 **AI-Powered Notes** - Generate structured notes from transcripts
- 🗺️ **Mindmap Generation** - Create visual mindmaps from content
- 👤 **User Authentication** - Sign up/sign in with email or Google
- 💾 **Save & Manage** - Save notes to your personal dashboard
- 📥 **Export Options** - Download notes and mindmaps as documents

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4o-mini
- **UI Components**: Radix UI, Lucide React

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SmartNotes
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Variables

**Option 1: Use the setup wizard (Recommended)**
```bash
npm run setup-env
```

**Option 2: Manual setup**
Copy the environment template and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smartnotes"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Database Setup

1. **Install PostgreSQL** on your system
2. **Create a database** named `smartnotes`
3. **Run database migrations**:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your `.env.local` file

#### NextAuth Secret
Generate a random secret key:
```bash
openssl rand -base64 32
```

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Notes

1. **Sign up/Sign in** to your account
2. **Choose input method**:
   - Live Audio: Record audio directly
   - YouTube: Paste a YouTube URL
   - File Upload: Upload an audio/video file
3. **Review transcript** and make edits if needed
4. **Generate notes and mindmap** automatically
5. **Save to dashboard** for later access

### Managing Notes

- View all saved notes in your **Dashboard**
- Click on any note to view full content
- Download notes as Word documents
- Delete notes you no longer need

## API Endpoints

- `POST /api/auth/register` - User registration
- `GET /api/notes` - Get user's notes
- `POST /api/notes/save` - Save a new note
- `GET /api/notes/[id]` - Get specific note
- `DELETE /api/notes/[id]` - Delete note
- `POST /api/generate-notes` - Generate structured notes
- `POST /api/generate-mindmap` - Generate mindmap
- `POST /api/transcribe` - Transcribe audio/video
- `POST /api/youtube-transcript` - Extract YouTube transcript

## Database Schema

### Users
- `id`, `name`, `email`, `password`, `image`, `createdAt`, `updatedAt`

### Notes
- `id`, `title`, `transcript`, `structuredNotes`, `mindmapData`, `source`, `sourceUrl`, `fileName`, `userId`, `createdAt`, `updatedAt`

### Authentication Tables
- `Account`, `Session`, `VerificationToken` (managed by NextAuth.js)

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env.local`
   - Ensure PostgreSQL is running
   - Verify database exists

2. **OpenAI API Error**
   - Check your `OPENAI_API_KEY` in `.env.local`
   - Ensure you have sufficient API credits
   - Verify the key has proper permissions

3. **Authentication Issues**
   - Check your `NEXTAUTH_SECRET` in `.env.local`
   - Ensure `NEXTAUTH_URL` matches your development URL
   - Clear browser cookies and try again

4. **Mindmap Not Displaying**
   - Check browser console for errors
   - Ensure mindmap data is valid JSON
   - Try refreshing the page

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database studio
npm run db:studio

# Generate Prisma client
npm run db:generate

# Push database changes
npm run db:push
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.