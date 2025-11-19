import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret =
      configService.get<string>('GOOGLE_CLIENT_SECRET') || '';

    if (!clientID || !clientSecret) {
      console.warn(
        '⚠️  Google OAuth credentials are not configured. Google login will not work.',
      );
      console.warn(
        '   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        '/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): any {
    const { id, name, emails } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value || '',
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: profile.photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
