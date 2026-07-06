import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WorkspaceNotification, NotificationType, Severity } from '@shared/types';
import { EventEmitter } from 'events';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private eventBus = new EventEmitter();

  constructor(private readonly prisma: PrismaService) {
    // Basic event bus listeners for auto-actions
    this.eventBus.on('system_alert', (data) => this.createAlert(data));
  }

  async findAll(workspaceId: string, unreadOnly: boolean = false) {
    const where: any = { workspaceId };
    if (unreadOnly) {
      where.isRead = false;
    }
    return (this.prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(workspaceId: string, id: string) {
    const notification = await (this.prisma as any).notification.findFirst({
      where: { id, workspaceId }
    });
    if (!notification) throw new NotFoundException('Notification not found');
    
    return (this.prisma as any).notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllRead(workspaceId: string) {
    await (this.prisma as any).notification.updateMany({
      where: { workspaceId, isRead: false },
      data: { isRead: true }
    });
    return { success: true };
  }

  async remove(workspaceId: string, id: string) {
    const notification = await (this.prisma as any).notification.findFirst({
      where: { id, workspaceId }
    });
    if (notification) {
      await (this.prisma as any).notification.delete({
        where: { id }
      });
    }
    return { success: true };
  }

  /**
   * Internal method to trigger a new workspace alert.
   * Can be called directly or via the internal event bus.
   */
  async createAlert(data: {
    workspaceId: string;
    type: NotificationType;
    severity: Severity;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    const notification = await (this.prisma as any).notification.create({
      data: {
        workspaceId: data.workspaceId,
        type: data.type,
        severity: data.severity,
        title: data.title,
        message: data.message,
        isRead: false,
        metadata: data.metadata || {},
      },
    });

    this.logger.log(`Alert Dispatched: [${data.severity.toUpperCase()}] ${data.title} for Workspace ${data.workspaceId}`);

    // In production, this would trigger Email/Slack/Webhook workers via a queue
    return notification;
  }

  /**
   * Public emitter for other services to use.
   */
  emit(event: string, payload: any) {
    this.eventBus.emit(event, payload);
  }
}