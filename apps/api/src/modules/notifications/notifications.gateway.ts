
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    const workspaceId = client.handshake.query.workspaceId as string;
    if (workspaceId) {
      client.join(`workspace:${workspaceId}`);
      this.logger.debug(`Client ${client.id} joined workspace ${workspaceId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  sendToWorkspace(workspaceId: string, event: string, payload: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, payload);
  }

  broadcastSystemMessage(message: string) {
    this.server.emit('system_message', { message });
  }
}
