import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let service: BillingService;

  const mockBillingService = {
    createCheckoutSession: jest.fn(),
    getSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    updateSubscription: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    service = module.get<BillingService>(BillingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('should create a Stripe checkout session', async () => {
      const planId = 'pro';
      const expectedResult = {
        url: 'https://checkout.stripe.com/test',
        sessionId: 'test-session-id',
      };

      mockBillingService.createCheckoutSession.mockResolvedValue(expectedResult);

      const result = await controller.createCheckoutSession({ planId }, mockUser);

      expect(service.createCheckoutSession).toHaveBeenCalledWith(planId, mockUser.id);
      expect(result).toHaveProperty('url');
    });
  });

  describe('getSubscription', () => {
    it('should return user subscription', async () => {
      const expectedResult = {
        id: 'sub_123',
        status: 'active',
        plan: 'pro',
      };

      mockBillingService.getSubscription.mockResolvedValue(expectedResult);

      const result = await controller.getSubscription(mockUser);

      expect(service.getSubscription).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });
});

