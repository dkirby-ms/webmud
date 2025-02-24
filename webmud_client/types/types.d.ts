import { NextRequest as DefaultNextRequest } from 'next/server'


declare global {
  declare interface NextRequest extends DefaultNextRequest {
    // add more attributes here
    auth: {
      user: User
    }
  }
}

declare module "next-auth" {
  interface Session {
    userId?: string;
  }
}