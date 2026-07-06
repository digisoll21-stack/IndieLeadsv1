import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return (this.prisma as any).domain.findMany({
      where: { workspaceId },
      include: { 
        inboxes: {
          select: { id: true, email: true, status: true }
        }
      }
    });
  }

  async verifyDNS(workspaceId: string, domainId: string) {
    const domain = await (this.prisma as any).domain.findFirst({
      where: { id: domainId, workspaceId }
    });

    if (!domain) throw new NotFoundException('Domain not found');

    this.logger.log(`Verifying DNS for ${domain.domainName}`);

    const dnsHealth = { spf: false, dkim: false, dmarc: false };
    const domainName = domain.domainName;

    try {
      // SPF Check
      const txtRecords = await resolveTxt(domainName).catch(() => []);
      dnsHealth.spf = txtRecords.some(records => records.some(r => r.includes('v=spf1')));

      // DMARC Check
      const dmarcRecords = await resolveTxt(`_dmarc.${domainName}`).catch(() => []);
      dnsHealth.dmarc = dmarcRecords.some(records => records.some(r => r.includes('v=DMARC1')));

      // DKIM Check (Heuristic selectors check)
      const commonSelectors = ['google', 'default', 'ms', 'api'];
      const dkimResults = await Promise.all(
        commonSelectors.map(s => resolveTxt(`${s}._domainkey.${domainName}`).catch(() => []))
      );
      dnsHealth.dkim = dkimResults.some(res => res.some(records => records.some(r => r.includes('v=DKIM1'))));

    } catch (err) {
      this.logger.error(`DNS check failed for ${domainName}: ${err.message}`);
    }

    const checkResults = {
      spfValid: dnsHealth.spf,
      dkimValid: dnsHealth.dkim,
      dmarcValid: dnsHealth.dmarc,
      lastVerifiedAt: new Date(),
    };

    return (this.prisma as any).domain.update({
      where: { id: domainId },
      data: { 
        ...checkResults,
        isVerified: checkResults.spfValid && checkResults.dkimValid
      }
    });
  }

  async create(workspaceId: string, domainName: string) {
    return (this.prisma as any).domain.create({
      data: {
        workspaceId,
        domainName,
        isVerified: false,
        spfValid: false,
        dkimValid: false,
        dmarcValid: false
      }
    });
  }
}
