import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { TwoFactorService } from './services/two-factor.service';
import { MagicLinkService } from './services/magic-link.service';
import { LoginActivityService } from './services/login-activity.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    ReferralsModule,
    AffiliatesModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '1h'; // Shorter access token
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
          signOptions: {
            expiresIn: expiresIn,
          },
        } as any;
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    GitHubStrategy,
    TwoFactorService,
    MagicLinkService,
    LoginActivityService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
