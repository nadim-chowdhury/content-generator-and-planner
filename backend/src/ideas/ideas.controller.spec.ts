import { Test, TestingModule } from '@nestjs/testing';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';

describe('IdeasController', () => {
  let controller: IdeasController;
  let service: IdeasService;

  const mockIdeasService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdeasController],
      providers: [
        {
          provide: IdeasService,
          useValue: mockIdeasService,
        },
      ],
    }).compile();

    controller = module.get<IdeasController>(IdeasController);
    service = module.get<IdeasService>(IdeasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new idea', async () => {
      const createIdeaDto: CreateIdeaDto = {
        title: 'Test Idea',
        description: 'Test Description',
        platform: 'instagram',
      };

      const expectedResult = {
        id: '1',
        ...createIdeaDto,
        userId: mockUser.id,
      };

      mockIdeasService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createIdeaDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createIdeaDto, mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of ideas', async () => {
      const expectedResult = [
        { id: '1', title: 'Idea 1' },
        { id: '2', title: 'Idea 2' },
      ];

      mockIdeasService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser, {});

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, {});
      expect(result).toEqual(expectedResult);
    });
  });
});

