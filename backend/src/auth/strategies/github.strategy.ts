import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET') || '';
    
    if (!clientID || !clientSecret) {
      console.warn('⚠️  GitHub OAuth credentials are not configured. GitHub login will not work.');
      console.warn('   Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file');
    }
    
    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || '/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, username, emails, photos } = profile;
    const user = {
      githubId: id.toString(),
      email: emails?.[0]?.value || `${username}@github.local`,
      username,
      picture: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}

