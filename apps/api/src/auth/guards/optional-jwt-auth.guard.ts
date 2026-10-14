import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // If token is invalid or absent, continue without error (user is null)
    if (err || !user) {
      return null;
    }
    return user;
  }
}
