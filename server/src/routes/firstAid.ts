import { Router } from 'express';
import { z } from 'zod';
import { store } from '../data/store.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

export const firstAidRouter = Router();

// 1. PUBLIC FIRST-AID EDUCATIONAL ARTICLES
firstAidRouter.get('/first-aid/articles', (_req, res) => {
  const published = store.firstAidArticles.filter((a) => a.is_published);
  res.json({ data: published });
});

firstAidRouter.get('/first-aid/articles/:slug', (req, res) => {
  const { slug } = req.params;
  const article = store.firstAidArticles.find((a) => a.slug === slug && a.is_published);

  if (!article) {
    res.status(404).json({
      error: {
        code: 'ARTICLE_NOT_FOUND',
        message: 'No verified first-aid guidance found for this topic.',
      },
    });
    return;
  }

  res.json({ data: article });
});

// 2. USER FIRST-AID INVENTORY (PROTECTED)
const firstAidItemInputSchema = z.object({
  item_name: z.string().trim().min(1, 'Item name is required.').max(200),
  quantity: z.coerce.number().finite().nonnegative('Quantity cannot be negative.').max(99999),
  unit: z.string().trim().min(1).max(40).default('item'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format.').nullable().optional(),
  storage_notes: z.string().trim().max(500).optional(),
});

firstAidRouter.get('/first-aid/items', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const items = Array.from(store.firstAidItems.values()).filter((item) => item.user_id === userId);
  res.json({ data: items });
});

firstAidRouter.post('/first-aid/items', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const body = firstAidItemInputSchema.parse(req.body);

    const now = new Date().toISOString();
    const newItem = {
      id: randomUUID(),
      user_id: userId,
      item_name: body.item_name,
      quantity: body.quantity,
      unit: body.unit,
      expiry_date: body.expiry_date || null,
      storage_notes: body.storage_notes || '',
      created_at: now,
      updated_at: now,
    };

    store.firstAidItems.set(newItem.id, newItem);
    res.status(201).json({ data: newItem });
  } catch (err) {
    next(err);
  }
});

firstAidRouter.patch('/first-aid/items/:itemId', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const existing = store.firstAidItems.get(itemId);

    if (!existing || existing.user_id !== userId) {
      res.status(404).json({
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Item not found in your inventory.',
        },
      });
      return;
    }

    const body = firstAidItemInputSchema.partial().parse(req.body);
    const updated = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
    };

    store.firstAidItems.set(itemId, updated);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

firstAidRouter.delete('/first-aid/items/:itemId', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { itemId } = req.params;
  const existing = store.firstAidItems.get(itemId);

  if (!existing || existing.user_id !== userId) {
    res.status(404).json({
      error: {
        code: 'ITEM_NOT_FOUND',
        message: 'Item not found in your inventory.',
      },
    });
    return;
  }

  store.firstAidItems.delete(itemId);
  res.json({ data: { success: true, message: 'Item removed from inventory.' } });
});
