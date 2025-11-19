import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const expectedResult = {
        user: { id: '1', email: signupDto.email, name: signupDto.name },
        message: 'User created successfully',
      };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signupDto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const expectedResult = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: loginDto.email },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
