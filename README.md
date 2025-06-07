# ImageGenHub - Community Meme Generator & Voting Platform

A full-stack web application where users can create, share, and vote on memes.

## Features

- 🎨 Meme Creation Studio with live preview
- ⬆️ Upvote/Downvote system
- 💬 Comment system
- 📊 Trending memes and sorting options
- 👤 User authentication
- 📱 Mobile-responsive design

## Tech Stack

- Frontend: React + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- Authentication: JWT
- File Storage: Cloudinary

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. Start the development servers:
   ```bash
   npm start
   ```

## Project Structure

```
imagegenhub/
├── frontend/           # React frontend
├── backend/           # Node.js backend
└── package.json       # Root package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 