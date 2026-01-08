import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to make authentication optional
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (err) {
      // If authentication fails, still allow the request
      return true;
    }
  }

  handleRequest(err: any, user: any) {
    // If there's an error or no user, just return null instead of throwing
    if (err || !user) {
      return null;
    }
    return user;
  }
}
