import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('FACEBOOK_APP_ID') || '';
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET') || '';

    if (!clientID || !clientSecret) {
      console.warn(
        '⚠️  Facebook OAuth credentials are not configured. Facebook login will not work.',
      );
      console.warn(
        '   Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in your .env file',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('FACEBOOK_CALLBACK_URL') ||
        '/api/auth/facebook/callback',
      scope: 'email',
      profileFields: ['emails', 'name'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): any {
    const { id, name, emails } = profile;
    const user = {
      facebookId: id,
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: profile.photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
