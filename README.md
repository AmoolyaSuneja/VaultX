# VaultX

Secure digital vault with a Node/Express backend and a React/Vite frontend.

## Project structure

- `backend/`: Express server, API routes, models, middleware, and database config
- `frontend/`: Current React + Vite application
- `uploads/`: Uploaded file storage

## Scripts

- `npm run dev`: Start the backend
- `npm run dev:backend`: Start the backend
- `npm run dev:frontend`: Start the Vite frontend
- `npm run build`: Build the frontend into `frontend/dist`
- `npm start`: Start the backend in normal mode

## Deployment

This project is ready to deploy on Vercel with `vercel.json`.

Set these environment variables in Vercel before deploying:

- `MONGO_URI`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APP_URL` with your deployed app URL
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `MAIL_FROM`

For Gmail, create an App Password in your Google account and use it as `GMAIL_APP_PASSWORD`.
When a two-person access request is created, VaultX emails the assigned approver a link to the deployed entry page.
Protected file share links are also generated with the deployed app URL.

## Notes

- The old static frontend has been removed.
- The backend now serves only the built React app from `frontend/dist`.
- If `frontend/dist` does not exist yet, the backend returns a helpful message telling you to build the frontend or run the Vite app separately.
