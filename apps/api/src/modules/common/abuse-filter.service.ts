import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class AbuseFilterService {
    private readonly logger = new Logger(AbuseFilterService.name);

    // Simple list of forbidden patterns (illegal/toxic spam)
    private readonly forbiddenPatterns = [
        /viagra/gi,
        /casino/gi,
        /lottery/gi,
        /winner/gi,
        /inheritance/gi,
        /enlarge/gi,
        /pharmacy/gi,
        /money back/gi,
        /unclaimed/gi,
        /cryptocurrency investment/gi,
        /guaranteed profit/gi,
    ];

    /**
     * Scans content for forbidden patterns.
     * Throws BadRequestException if a violation is found.
     */
    validateContent(content: string, type: 'subject' | 'body' = 'body') {
        for (const pattern of this.forbiddenPatterns) {
            if (pattern.test(content)) {
                this.logger.warn(`Abuse Filter: Pattern match found in ${type}: ${pattern.source}`);
                throw new BadRequestException(`Content in ${type} contains potential spam or prohibited terms. Please review.`);
            }
        }
        return true;
    }

    /**
     * Scans a sequence of steps.
     */
    validateSequence(steps: { subject?: string; body?: string }[]) {
        for (const step of steps) {
            if (step.subject) this.validateContent(step.subject, 'subject');
            if (step.body) this.validateContent(step.body, 'body');
        }
        return true;
    }
}
