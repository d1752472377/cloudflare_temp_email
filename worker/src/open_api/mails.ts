import { Context, Hono } from 'hono'
import { jwt as jwtMiddleware } from 'hono/jwt'
import { Jwt } from 'hono/utils/jwt'
import i18n from '../i18n';
import {
    getBooleanValue, getStringValue, getJsonSetting,
    checkCfTurnstile, getStringArray, getSplitStringListValue,
    isAddressCountLimitReached
} from '../utils';
import {
    newAddress, handleMailListQuery, deleteAddressWithData,
    getAddressPrefix, generateRandomName
} from '../common';
import { HonoCustomType } from '../types';
import { CONSTANTS } from '../constants';
import { sendMail } from '../mails_api/send_mail_api';
import { RawMailRow } from '../models';
import { resolveRawEmailRow } from '../gzip';

const OPEN_API_PREFIX = '/external/api';

/**
 * Verify x-api-key header matches OPEN_API_KEY env var.
 * If OPEN_API_KEY is not set, the open API is disabled.
 */
const openApiAuth = async (c: Context<HonoCustomType>, next: Function) => {
    const msgs = i18n.getMessagesbyContext(c);
    const apiKey = c.env.OPEN_API_KEY;
    if (!apiKey) {
        return c.text(msgs?.ExternalAPIDisabledMsg || "External API is not configured", 403);
    }
    const headerKey = c.req.raw.headers.get('x-api-key');
    if (!headerKey || headerKey !== apiKey) {
        return c.text(msgs?.ExternalAPIInvalidKeyMsg || "Invalid API key", 401);
    }
    await next();
};

const openApi = new Hono<HonoCustomType>();
openApi.use('/*', openApiAuth);

// ==================== Address Management ====================

/**
 * Create a new temporary email address.
 * POST /external/api/address
 * Body: { name?: string, domain?: string }
 */
openApi.post('/address', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    if (!getBooleanValue(c.env.ENABLE_USER_CREATE_EMAIL)) {
        return c.text(msgs.NewAddressDisabledMsg, 403)
    }

    const { name, domain } = await c.req.json().catch(() => ({}));

    let finalName = name;
    if (!finalName) {
        finalName = generateRandomName(c);
    }

    // check name block list
    try {
        const value = await getJsonSetting(c, CONSTANTS.ADDRESS_BLOCK_LIST_KEY);
        const blockList = (value || []) as string[];
        if (blockList.some((item) => finalName.includes(item))) {
            return c.text(`Name[${finalName}] is blocked`, 400)
        }
    } catch (error) {
        console.error(error);
    }

    try {
        const addressPrefix = await getAddressPrefix(c);
        const sourceMeta = 'open_api';
        const res = await newAddress(c, {
            name: finalName, domain: domain,
            enablePrefix: true,
            enableRandomSubdomain: false,
            checkLengthByConfig: true,
            addressPrefix,
            sourceMeta
        });
        return c.json(res);
    } catch (e) {
        return c.text(`${msgs.FailedCreateAddressMsg}: ${(e as Error).message}`, 400)
    }
});

// ==================== Mail Operations ====================

/**
 * List mails for a given email address.
 * GET /external/api/mails?email=xxx&limit=10&offset=0
 */
openApi.get('/mails', async (c) => {
    const email = c.req.query('email');
    if (!email) {
        return c.json({ error: "email query parameter is required" }, 400);
    }
    const { limit, offset } = c.req.query();
    return await handleMailListQuery(c,
        `SELECT * FROM raw_mails where address = ?`,
        `SELECT count(*) as count FROM raw_mails where address = ?`,
        [email], limit, offset
    );
});

/**
 * Get a single mail by ID.
 * GET /external/api/mail/:id?email=xxx
 */
openApi.get('/mail/:id', async (c) => {
    const email = c.req.query('email');
    if (!email) {
        return c.json({ error: "email query parameter is required" }, 400);
    }
    const { id } = c.req.param();
    const result = await c.env.DB.prepare(
        `SELECT * FROM raw_mails where id = ? and address = ?`
    ).bind(id, email).first();
    if (!result) return c.json(null);
    return c.json(await resolveRawEmailRow(result as RawMailRow));
});

/**
 * Delete a mail by ID.
 * DELETE /external/api/mail/:id?email=xxx
 */
openApi.delete('/mail/:id', async (c) => {
    const email = c.req.query('email');
    if (!email) {
        return c.json({ error: "email query parameter is required" }, 400);
    }
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM raw_mails WHERE address = ? and id = ?`
    ).bind(email, id).run();
    return c.json({ success });
});

/**
 * Send mail from a temporary address.
 * POST /external/api/send_mail
 * Body: { address: string, from_name: string, to_mail: string, to_name: string, subject: string, content: string, is_html?: boolean }
 */
openApi.post('/send_mail', async (c) => {
    const msgs = i18n.getMessagesbyContext(c);
    const reqJson = await c.req.json();
    const { address } = reqJson;
    if (!address) {
        return c.json({ error: "address is required" }, 400);
    }
    try {
        await sendMail(c, address, reqJson);
    } catch (e) {
        console.error("Failed to send mail", e);
        return c.text(`Failed to send mail ${(e as Error).message}`, 400)
    }
    return c.json({ status: "ok" })
});

export { openApi, OPEN_API_PREFIX };
