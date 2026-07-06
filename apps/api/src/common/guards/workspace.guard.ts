import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { WorkspacesService } from '../../modules/workspaces/workspaces.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly workspacesService: WorkspacesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.headers['x-workspace-id'] || request.query['workspaceId'] || request.params['workspaceId'];

    if (!user) return false;
    if (!workspaceId) throw new ForbiddenException('Workspace context is required');

    const isMember = await this.workspacesService.isMember(workspaceId, user.id);
    if (!isMember) throw new ForbiddenException('You do not have access to this workspace');

    request.workspaceId = workspaceId;
    return true;
  }
}