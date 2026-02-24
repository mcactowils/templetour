# Admin Access Setup

## How to Enable Admin Access

To allow specific users to access the admin panel (`/admin`), you need to add their email addresses to the admin list in **one** file:

### Admin Email Configuration
**File:** `src/lib/admin.ts`
**Line:** ~5

Update the `ADMIN_EMAILS` array:
```typescript
export const ADMIN_EMAILS = [
  'your-email@example.com',
  'second-admin@example.com',
  // Add more admin emails as needed
]
```

## How to Find Your User Emails

1. **Method 1: Check your login session**
   - Log into the app
   - Open browser developer tools (F12)
   - Go to Application/Storage tab → Local Storage or Cookies
   - Look for NextAuth session data

2. **Method 2: Check the database directly**
   - Use your database admin tool
   - Query the `users` table: `SELECT email FROM users;`

3. **Method 3: Add a temporary debug endpoint**
   - Log in to the app
   - Check the browser network tab for API calls to see your user data

## Admin Capabilities

Admin users have enhanced permissions:
- **Access admin panel** - Full temple data management at `/admin`
- **Edit any schedule** - Can edit/delete any user's schedules/appointments
- **Delete any comments** - Can delete any user's comments
- **View all data** - Access to temple administration dashboard

## Security Notes

- Only add trusted users to the admin list
- Admin users have extensive permissions across the application
- Users must have an account in the system (be registered) to gain admin access
- Admin emails are centrally managed in `src/lib/admin.ts`

## Testing Admin Access

1. Add your email to `src/lib/admin.ts`
2. Restart the development server (`npm run dev`)
3. Navigate to `/admin`
4. You should see the admin dashboard
5. Non-admin users will be redirected to the home page with an "Access Denied" message
6. Test editing other users' schedules and comments to verify admin permissions