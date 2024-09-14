import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userDto = { email: 'test@example.com', password: 'password', name: 'Test User' };
      const hashedPassword = 'hashedPassword';

      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword);
      jest.spyOn(prismaService.user, 'create').mockResolvedValueOnce({ ...userDto, id: '1', passwordHash: hashedPassword });

      const result = await userService.create(userDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(userDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { ...userDto, passwordHash: hashedPassword },
      });
      expect(result).toEqual({ ...userDto, id: '1', passwordHash: hashedPassword });
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const user = { id: '1', email, name: 'Test User', passwordHash: 'hashedPassword' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(user);

      const result = await userService.findByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);

      const result = await userService.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('validateUser', () => {
    it('should return user if email and password are valid', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const user = { id: '1', email, name: 'Test User', passwordHash: 'hashedPassword' };

      jest.spyOn(userService, 'findByEmail').mockResolvedValueOnce(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const result = await userService.validateUser(email, password);

      expect(userService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.passwordHash);
      expect(result).toEqual(user);
    });

    it('should return null if email is not found', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValueOnce(null);

      const result = await userService.validateUser('notfound@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';
      const user = { id: '1', email, name: 'Test User', passwordHash: 'hashedPassword' };

      jest.spyOn(userService, 'findByEmail').mockResolvedValueOnce(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      const result = await userService.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('updateBiometricToken', () => {
    it('should update the biometric token of a user', async () => {
      const userId = '1';
      const biometricToken = 'newToken';
      const user = { id: userId, email: 'test@example.com', name: 'Test User', passwordHash: 'hashedPassword', biometricToken };

      jest.spyOn(prismaService.user, 'update').mockResolvedValueOnce(user);

      const result = await userService.updateBiometricToken(userId, biometricToken);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { biometricToken },
      });
      expect(result).toEqual(user);
    });
  });
});
