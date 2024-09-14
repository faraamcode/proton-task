import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './user.model'; // Updated import path
import { JwtService } from '@nestjs/jwt';

@Resolver(() => User)
export class UserResolver {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) { }

    @Query(() => [User])
    async users(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Mutation(() => User)
    async register(
        @Args('email') email: string,
        @Args('password') password: string,
        @Args('name', { nullable: true }) name?: string,
    ): Promise<User> {
        return this.userService.create({ email, password });
    }

    @Mutation(() => String, { nullable: true })
    async login(
        @Args('email') email: string,
        @Args('password') password: string,
    ): Promise<string | null> {
        const user = await this.userService.validateUser(email, password);
        if (user) {
            // Generate a JWT token
            return this.jwtService.sign({ userId: user.id });
        }
        return null;
    }

    @Mutation(() => String, { nullable: true })
    async loginWithBiometrics(
        @Args('biometricToken') biometricToken: string,
    ): Promise<string | null> {
        const user = await this.userService.findOneWithToken(biometricToken)
        if (user) {
            // Generate a JWT token
            return this.jwtService.sign({ userId: user.id });
        }
        return null;
    }
}
