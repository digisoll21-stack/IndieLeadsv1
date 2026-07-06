
import { Controller, Get, Patch, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as bcrypt from 'bcryptjs';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getMe(@CurrentUser() user: any) {
        const fullUser = await this.usersService.findById(user.id);
        if (!fullUser) throw new UnauthorizedException();

        // Don't return password hash
        const { passwordHash, ...result } = fullUser;
        return result;
    }

    @Patch('me')
    async updateMe(@CurrentUser() user: any, @Body() data: any) {
        const updateData: any = {};

        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;

        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        const updated = await this.usersService.update(user.id, updateData);
        const { passwordHash, ...result } = updated;
        return result;
    }
}
