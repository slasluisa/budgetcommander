# Replace Email with Username for Authentication

## Overview

Replace email-based authentication with username-based authentication. Users will register and log in with a username + password instead of email + password. The `email` column is removed entirely since it serves no other purpose (no email sending, verification, or password reset).

## Username Constraints

- Alphanumeric characters and underscores only: `/^[a-zA-Z0-9_]{3,20}$/`
- 3-20 characters
- Unique per user (database constraint)

## Changes

### Database Schema (`prisma/schema.prisma`)

- Remove `email String @unique`
- Add `username String @unique`
- Migration renames the column to preserve existing data

### Auth Config (`src/lib/auth.ts`)

- Credentials provider accepts `username` + `password` instead of `email` + `password`
- User lookup changes from `findUnique({ where: { email } })` to `findUnique({ where: { username } })`
- JWT token carries `username` instead of `email`
- Session callback maps `username` instead of `email`

### Registration Endpoint (`src/app/api/auth/register/route.ts`)

- Accept `username` instead of `email` in request body
- Validate username against `/^[a-zA-Z0-9_]{3,20}$/`
- Check for duplicate username instead of duplicate email
- Create user with `username` instead of `email`

### Login Page (`src/app/login/page.tsx`)

- Replace `type="email"` input with `type="text"` input for username
- Update label from "Email" to "Username"
- Update error message to "Invalid username or password"
- Pass `username` instead of `email` to signIn credentials

### Register Page (`src/app/register/page.tsx`)

- Replace `type="email"` input with `type="text"` input for username
- Add client-side validation for username format
- Update label from "Email" to "Username"

### Admin Panel (`src/app/admin/admin-panel.tsx`)

- Update `User` type: `email` field becomes `username`
- Display `username` instead of `email` in user list

### Admin Page (`src/app/admin/page.tsx`)

- Select `username` instead of `email` in user query

### Admin Ban API (`src/app/api/admin/users/[id]/ban/route.ts`)

- Return `username` instead of `email` in response select

### Profile API (`src/app/api/user/profile/route.ts`)

- Return `username` instead of `email` in response select

## Files Not Affected

- `src/app/profile/page.tsx` - Does not reference email
- `src/app/players/[id]/page.tsx` - Does not reference email
- Game, deck, season logic - Unrelated to auth fields

## Migration Strategy

Single Prisma migration that renames `email` → `username`. Existing email values become usernames (users will need to know their "username" is their old email, or data can be manually cleaned if the app has few users).
