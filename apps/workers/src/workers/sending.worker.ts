
/**
 * SENDING WORKER POOL (Skeleton)
 * 
 * Responsibility:
 * - Consumes the `email_sending_queue`.
 * - Acquires Redis Lock for specific inbox before execution.
 * - Uses Provider Adapters (Google/Outlook/SMTP) to send actual emails.
 * - Updates SendingLogs and increments Redis daily/hourly counters.
 */

export class SendingWorker {
  async process(job: any) {
    // 1. Acquire Lock: lock:inbox:{id}
    // 2. Refresh Token if needed
    // 3. Send Email via Adapter
    // 4. Update Logs & Stats
    // 5. Handle Bounces/Errors
  }
}
