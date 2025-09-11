# WebMUD Authentication Configuration

## Overview

This document describes the authentication setup for the WebMUD application using Microsoft Entra ID CIAM (Customer Identity and Access Management) with OAuth2 authorization code flow with PKCE.

## Configuration Summary

### App Registrations

1. **webmud_client** (Frontend)
   - Client ID: `9354e362-04f3-4afc-87ce-556429e17d59`
   - Used for user authentication via OAuth2 with PKCE
   - Requests scopes: `openid`, `profile`, `email`, and `api://ea73f4fc-76b6-4ddf-b629-4715d6513ef0/GameService.Access`

2. **webmud_service** (Backend API)
   - Client ID: `ea73f4fc-76b6-4ddf-b629-4715d6513ef0`
   - Protected by scope: `api://ea73f4fc-76b6-4ddf-b629-4715d6513ef0/GameService.Access`
   - Validates JWT tokens with proper audience and scope verification

### Tenant Information

- **Tenant ID**: `7a9da048-83f3-4666-8dbb-8ee824fcb897`
- **Tenant Name**: `bloodwar`
- **Authority**: `https://bloodwar.ciamlogin.com/7a9da048-83f3-4666-8dbb-8ee824fcb897`
- **User flow**: 'signupsignin'
