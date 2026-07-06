import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { SequencerService } from '@api/modules/campaigns/sequencer.service';

@Injectable()
export class SequencerProcessor implements OnModuleInit {
    private readonly logger = new Logger(SequencerProcessor.name);
    private worker: Worker;

    constructor(
        private readonly configService: ConfigService,
        private readonly sequencerService: SequencerService,
    ) { }

    onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

        this.worker = new Worker(
            'campaign_sequencing_queue',
            async (job: Job) => {
                this.logger.log(`Processing campaign sequencing job ${job.id}`);
                try {
                    await this.sequencerService.processSequences();
                } catch (err) {
                    this.logger.error(`Sequencing failed: ${err.message}`);
                    throw err;
                }
            },
            {
                connection: { url: redisUrl },
                concurrency: 1, // Only one sequencer should run at a time globally (ideally handled by BullMQ repeat)
            },
        );

        this.worker.on('failed', (job, err) => {
            this.logger.error(`Sequencing Job ${job?.id} failed: ${err.message}`);
        });
    }
}
