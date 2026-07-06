
import { Controller, Post, Get, Body, Param, UseGuards, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class InvitesController {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate an invite link for a workspace
     * POST /workspaces/:id/invites
     */
    @Post('workspaces/:workspaceId/invites')
    @UseGuards(JwtAuthGuard)
    async createInvite(
        @Param('workspaceId') workspaceId: string,
        @CurrentUser() user: any
    ) {
        // 1. Verify user is a member of this workspace
        const member = await this.prisma.member.findUnique({
            where: { userId_workspaceId: { userId: user.id, workspaceId } }
        });

        if (!member) throw new ForbiddenException('You are not a member of this workspace');

        // 2. Generate Invite Token
        const inviteToken = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

        // 3. Create a pending member record
        // We create a "shadow" member record that has no userId yet, just the token
        const pendingMember = await this.prisma.member.create({
            data: {
                workspaceId,
                inviteToken,
                inviteExpires: expiresAt,
                role: 'member'
            }
        });

        return {
            inviteUrl: `${process.env.FRONTEND_URL}/#/accept-invite/${inviteToken}`,
            token: inviteToken,
            expiresAt
        };
    }

    /**
     * Accept an invite
     * POST /invites/:token/accept
     */
    @Post('invites/:token/accept')
    @UseGuards(JwtAuthGuard)
    async acceptInvite(
        @Param('token') token: string,
        @CurrentUser() user: any
    ) {
        // 1. Find the pending invite
        const pendingMember = await this.prisma.member.findUnique({
            where: { inviteToken: token }
        });

        if (!pendingMember) throw new NotFoundException('Invalid invite link');

        // 2. Check if expired
        if (pendingMember.inviteExpires && new Date() > pendingMember.inviteExpires) {
            throw new BadRequestException('Invite link has expired');
        }

        // 3. Check if already taken (shouldn't happen if we clean up, but good safety)
        if (pendingMember.userId) {
            throw new BadRequestException('Invite already used');
        }

        // 4. Check if user is ALREADY in the workspace (via a different record)
        const existingMembership = await this.prisma.member.findUnique({
            where: { userId_workspaceId: { userId: user.id, workspaceId: pendingMember.workspaceId } }
        });

        if (existingMembership) {
            // If they are already a member, we can just delete this pending invite and return success
            await this.prisma.member.delete({ where: { id: pendingMember.id } });
            return { success: true, workspaceId: pendingMember.workspaceId, message: 'You are already a member' };
        }

        // 5. Assign the user to the member record
        // We update the existing placeholder record to now belong to this user
        try {
            await this.prisma.member.update({
                where: { id: pendingMember.id },
                data: {
                    userId: user.id,
                    inviteToken: null, // Clear token so it can't be reused
                    inviteExpires: null
                }
            });
        } catch (e) {
            // Handle race condition if they tried to double-join
            throw new BadRequestException('Failed to join workspace');
        }

        return { success: true, workspaceId: pendingMember.workspaceId };
    }
}
