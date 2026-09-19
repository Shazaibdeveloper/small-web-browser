// ============================================================================
// FILE: src/sites/sites.service.ts   (REPLACE THE WHOLE FILE)
// ============================================================================
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import type { Attributes, Tag } from 'sanitize-html';

import { CreateSiteDto } from './dto/create-site.dto';
import { Site, SiteDocument } from './schemas/site.schema';

/* --------------------------------------------------------------------------
 * 1. Address handling
 * ------------------------------------------------------------------------ */

export function normalizeAddress(raw: string): string {
  if (!raw) return '';

  let address = String(raw).trim().toLowerCase();
  address = address.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  address = address.split('#')[0].split('?')[0];
  address = address.replace(/^\/+/, '').replace(/\/+$/, '');
  address = address.replace(/\s+/g, '');

  return address;
}

export function isValidAddress(address: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
    address,
  );
}

/* --------------------------------------------------------------------------
 * 2. Containment of HTML we did not write
 * ------------------------------------------------------------------------ */

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'a', 'em', 'strong', 'b', 'i', 'u', 's',
  'code', 'pre', 'blockquote', 'q', 'cite',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'span', 'div', 'small', 'sub', 'sup', 'mark', 'abbr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'figure', 'figcaption',
];

/**
 * Explicit `Tag` return + explicit `Attributes` parameter is what silences
 * the "not assignable to type 'Transformer'" error: without them, TS unions
 * the two return shapes and widens `{}` to include the other branch's keys.
 */
function rewriteAnchor(_tagName: string, attribs: Attributes): Tag {
  const address = normalizeAddress(
    attribs.href ?? attribs['data-address'] ?? '',
  );

  if (!address) {
    return { tagName: 'span', attribs: {} };
  }

  return {
    tagName: 'a',
    attribs: {
      'data-address': address,
      href: `#/${address}`,
      rel: 'noopener noreferrer',
    },
  };
}

export function renderHtml(rawHtml: string): string {
  return sanitizeHtml(rawHtml ?? '', {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'data-address', 'title', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: rewriteAnchor,
    },
  });
}

export function toPlainText(html: string): string {
  return sanitizeHtml(html ?? '', { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSnippet(plainText: string, term: string): string {
  if (!plainText) return '';
  const idx = plainText.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1)
    return plainText.slice(0, 160) + (plainText.length > 160 ? '…' : '');

  const start = Math.max(0, idx - 60);
  const end = Math.min(plainText.length, idx + term.length + 100);
  return (
    (start > 0 ? '…' : '') +
    plainText.slice(start, end) +
    (end < plainText.length ? '…' : '')
  );
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* --------------------------------------------------------------------------
 * 3. The service
 * ------------------------------------------------------------------------ */

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly siteModel: Model<SiteDocument>,
  ) {}

  async publish(dto: CreateSiteDto) {
    const address = normalizeAddress(dto.address);
    if (!isValidAddress(address)) {
      throw new BadRequestException(
        `"${dto.address}" is not a usable address. Try something like tidepool.zz`,
      );
    }

    const html = renderHtml(dto.html);
    const plainText = toPlainText(html);
    const authorId = new Types.ObjectId(dto.authorId);

    const existing = await this.siteModel.findOne({ address });

    if (existing) {
      if (String(existing.authorId) !== String(authorId)) {
        throw new ConflictException(
          `${address} is already published by somebody else.`,
        );
      }

      existing.title = dto.title.trim();
      existing.html = html;
      existing.plainText = plainText;
      existing.revision += 1;
      await existing.save();

      return this.toResult(existing.toObject());
    }

    const created = await this.siteModel.create({
      address,
      title: dto.title.trim(),
      html,
      plainText,
      authorId,
      revision: 1,
    });

    return this.toResult(created.toObject());
  }

  async findByAddress(rawAddress: string) {
    const address = normalizeAddress(rawAddress);
    if (!address) return null;
    return this.siteModel.findOne({ address }).lean();
  }

  async resolve(rawAddress: string) {
    const address = normalizeAddress(rawAddress);
    const site = await this.findByAddress(address);

    if (!site) {
      return { found: false as const, address };
    }

    return { found: true as const, site: this.toResult(site) };
  }

  async list() {
    const sites = await this.siteModel
      .find({}, { address: 1, title: 1, authorId: 1, updatedAt: 1 })
      .sort({ address: 1 })
      .lean();

    return sites.map((s) => ({
      address: s.address,
      title: s.title,
      authorId: String(s.authorId),
      updatedAt: s.updatedAt ?? null,
    }));
  }

  async search(term: string, limit = 20) {
    const query = (term ?? '').trim();
    if (!query) return [];

    const ranked = await this.siteModel
      .find(
        { $text: { $search: query } },
        {
          score: { $meta: 'textScore' },
          address: 1,
          title: 1,
          plainText: 1,
          authorId: 1,
        },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    const hits =
      ranked.length > 0
        ? ranked
        : await this.siteModel
            .find(
              {
                $or: [
                  { title: new RegExp(escapeRegex(query), 'i') },
                  { plainText: new RegExp(escapeRegex(query), 'i') },
                ],
              },
              { address: 1, title: 1, plainText: 1, authorId: 1 },
            )
            .limit(limit)
            .lean();

    return hits.map((s) => ({
      address: s.address,
      title: s.title,
      authorId: String(s.authorId),
      snippet: buildSnippet(s.plainText ?? '', query),
    }));
  }

  private toResult(site: any) {
    return {
      id: String(site._id),
      address: site.address,
      title: site.title,
      html: site.html,
      authorId: String(site.authorId),
      revision: site.revision ?? 1,
      updatedAt: site.updatedAt ?? null,
    };
  }
}