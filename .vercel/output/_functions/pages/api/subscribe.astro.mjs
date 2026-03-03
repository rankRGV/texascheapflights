import PostalMime from 'postal-mime';
import { Webhook } from 'svix';
export { renderers } from '../../renderers.mjs';

//#region package.json
var version = "6.9.3";

//#endregion
//#region src/common/utils/build-pagination-query.ts
/**
* Builds a query string from pagination options
* @param options - Pagination options containing limit and either after or before (but not both)
* @returns Query string (without leading '?') or empty string if no options
*/
function buildPaginationQuery(options) {
	const searchParams = new URLSearchParams();
	if (options.limit !== void 0) searchParams.set("limit", options.limit.toString());
	if ("after" in options && options.after !== void 0) searchParams.set("after", options.after);
	if ("before" in options && options.before !== void 0) searchParams.set("before", options.before);
	return searchParams.toString();
}

//#endregion
//#region src/api-keys/api-keys.ts
var ApiKeys = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/api-keys", payload, options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
		return await this.resend.get(url);
	}
	async remove(id) {
		return await this.resend.delete(`/api-keys/${id}`);
	}
};

//#endregion
//#region src/common/utils/parse-email-to-api-options.ts
function parseAttachments(attachments) {
	return attachments?.map((attachment) => ({
		content: attachment.content,
		filename: attachment.filename,
		path: attachment.path,
		content_type: attachment.contentType,
		content_id: attachment.contentId
	}));
}
function parseEmailToApiOptions(email) {
	return {
		attachments: parseAttachments(email.attachments),
		bcc: email.bcc,
		cc: email.cc,
		from: email.from,
		headers: email.headers,
		html: email.html,
		reply_to: email.replyTo,
		scheduled_at: email.scheduledAt,
		subject: email.subject,
		tags: email.tags,
		text: email.text,
		to: email.to,
		template: email.template ? {
			id: email.template.id,
			variables: email.template.variables
		} : void 0,
		topic_id: email.topicId
	};
}

//#endregion
//#region src/render.ts
async function render(node) {
	let render;
	try {
		({render} = await import('../../chunks/render_resend_Bs-YE6Qm.mjs'));
	} catch {
		throw new Error("Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`.");
	}
	return render(node);
}

//#endregion
//#region src/batch/batch.ts
var Batch = class {
	constructor(resend) {
		this.resend = resend;
	}
	async send(payload, options) {
		return this.create(payload, options);
	}
	async create(payload, options) {
		const emails = [];
		for (const email of payload) {
			if (email.react) {
				email.html = await render(email.react);
				email.react = void 0;
			}
			emails.push(parseEmailToApiOptions(email));
		}
		return await this.resend.post("/emails/batch", emails, {
			...options,
			headers: {
				"x-batch-validation": options?.batchValidation ?? "strict",
				...options?.headers
			}
		});
	}
};

//#endregion
//#region src/broadcasts/broadcasts.ts
var Broadcasts = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.post("/broadcasts", {
			name: payload.name,
			segment_id: payload.segmentId,
			audience_id: payload.audienceId,
			preview_text: payload.previewText,
			from: payload.from,
			html: payload.html,
			reply_to: payload.replyTo,
			subject: payload.subject,
			text: payload.text,
			topic_id: payload.topicId,
			send: payload.send,
			scheduled_at: payload.scheduledAt
		}, options);
	}
	async send(id, payload) {
		return await this.resend.post(`/broadcasts/${id}/send`, { scheduled_at: payload?.scheduledAt });
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/broadcasts/${id}`);
	}
	async remove(id) {
		return await this.resend.delete(`/broadcasts/${id}`);
	}
	async update(id, payload) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.patch(`/broadcasts/${id}`, {
			name: payload.name,
			segment_id: payload.segmentId,
			audience_id: payload.audienceId,
			from: payload.from,
			html: payload.html,
			text: payload.text,
			subject: payload.subject,
			reply_to: payload.replyTo,
			preview_text: payload.previewText,
			topic_id: payload.topicId
		});
	}
};

//#endregion
//#region src/common/utils/parse-contact-properties-to-api-options.ts
function parseContactPropertyFromApi(contactProperty) {
	return {
		id: contactProperty.id,
		key: contactProperty.key,
		createdAt: contactProperty.created_at,
		type: contactProperty.type,
		fallbackValue: contactProperty.fallback_value
	};
}
function parseContactPropertyToApiOptions(contactProperty) {
	if ("key" in contactProperty) return {
		key: contactProperty.key,
		type: contactProperty.type,
		fallback_value: contactProperty.fallbackValue
	};
	return { fallback_value: contactProperty.fallbackValue };
}

//#endregion
//#region src/contact-properties/contact-properties.ts
var ContactProperties = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(options) {
		const apiOptions = parseContactPropertyToApiOptions(options);
		return await this.resend.post("/contact-properties", apiOptions);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contact-properties?${queryString}` : "/contact-properties";
		const response = await this.resend.get(url);
		if (response.data) return {
			data: {
				...response.data,
				data: response.data.data.map((apiContactProperty) => parseContactPropertyFromApi(apiContactProperty))
			},
			headers: response.headers,
			error: null
		};
		return response;
	}
	async get(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const response = await this.resend.get(`/contact-properties/${id}`);
		if (response.data) return {
			data: {
				object: "contact_property",
				...parseContactPropertyFromApi(response.data)
			},
			headers: response.headers,
			error: null
		};
		return response;
	}
	async update(payload) {
		if (!payload.id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const apiOptions = parseContactPropertyToApiOptions(payload);
		return await this.resend.patch(`/contact-properties/${payload.id}`, apiOptions);
	}
	async remove(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.delete(`/contact-properties/${id}`);
	}
};

//#endregion
//#region src/contacts/segments/contact-segments.ts
var ContactSegments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async list(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contacts/${identifier}/segments?${queryString}` : `/contacts/${identifier}/segments`;
		return await this.resend.get(url);
	}
	async add(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		return this.resend.post(`/contacts/${identifier}/segments/${options.segmentId}`);
	}
	async remove(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		return this.resend.delete(`/contacts/${identifier}/segments/${options.segmentId}`);
	}
};

//#endregion
//#region src/contacts/topics/contact-topics.ts
var ContactTopics = class {
	constructor(resend) {
		this.resend = resend;
	}
	async update(payload) {
		if (!payload.id && !payload.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = payload.email ? payload.email : payload.id;
		return this.resend.patch(`/contacts/${identifier}/topics`, payload.topics);
	}
	async list(options) {
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.id;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contacts/${identifier}/topics?${queryString}` : `/contacts/${identifier}/topics`;
		return this.resend.get(url);
	}
};

//#endregion
//#region src/contacts/contacts.ts
var Contacts = class {
	constructor(resend) {
		this.resend = resend;
		this.topics = new ContactTopics(this.resend);
		this.segments = new ContactSegments(this.resend);
	}
	async create(payload, options = {}) {
		if ("audienceId" in payload) {
			if ("segments" in payload || "topics" in payload) return {
				data: null,
				headers: null,
				error: {
					message: "`audienceId` is deprecated, and cannot be used together with `segments` or `topics`. Use `segments` instead to add one or more segments to the new contact.",
					statusCode: null,
					name: "invalid_parameter"
				}
			};
			return await this.resend.post(`/audiences/${payload.audienceId}/contacts`, {
				unsubscribed: payload.unsubscribed,
				email: payload.email,
				first_name: payload.firstName,
				last_name: payload.lastName,
				properties: payload.properties
			}, options);
		}
		return await this.resend.post("/contacts", {
			unsubscribed: payload.unsubscribed,
			email: payload.email,
			first_name: payload.firstName,
			last_name: payload.lastName,
			properties: payload.properties,
			segments: payload.segments,
			topics: payload.topics
		}, options);
	}
	async list(options = {}) {
		const segmentId = options.segmentId ?? options.audienceId;
		if (!segmentId) {
			const queryString = buildPaginationQuery(options);
			const url = queryString ? `/contacts?${queryString}` : "/contacts";
			return await this.resend.get(url);
		}
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/segments/${segmentId}/contacts?${queryString}` : `/segments/${segmentId}/contacts`;
		return await this.resend.get(url);
	}
	async get(options) {
		if (typeof options === "string") return this.resend.get(`/contacts/${options}`);
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!options.audienceId) return this.resend.get(`/contacts/${options?.email ? options?.email : options?.id}`);
		return this.resend.get(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`);
	}
	async update(options) {
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!options.audienceId) return await this.resend.patch(`/contacts/${options?.email ? options?.email : options?.id}`, {
			unsubscribed: options.unsubscribed,
			first_name: options.firstName,
			last_name: options.lastName,
			properties: options.properties
		});
		return await this.resend.patch(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`, {
			unsubscribed: options.unsubscribed,
			first_name: options.firstName,
			last_name: options.lastName,
			properties: options.properties
		});
	}
	async remove(payload) {
		if (typeof payload === "string") return this.resend.delete(`/contacts/${payload}`);
		if (!payload.id && !payload.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!payload.audienceId) return this.resend.delete(`/contacts/${payload?.email ? payload?.email : payload?.id}`);
		return this.resend.delete(`/audiences/${payload.audienceId}/contacts/${payload?.email ? payload?.email : payload?.id}`);
	}
};

//#endregion
//#region src/common/utils/parse-domain-to-api-options.ts
function parseDomainToApiOptions(domain) {
	return {
		name: domain.name,
		region: domain.region,
		custom_return_path: domain.customReturnPath,
		capabilities: domain.capabilities,
		open_tracking: domain.openTracking,
		click_tracking: domain.clickTracking,
		tls: domain.tls
	};
}

//#endregion
//#region src/domains/domains.ts
var Domains = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/domains", parseDomainToApiOptions(payload), options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/domains?${queryString}` : "/domains";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/domains/${id}`);
	}
	async update(payload) {
		return await this.resend.patch(`/domains/${payload.id}`, {
			click_tracking: payload.clickTracking,
			open_tracking: payload.openTracking,
			tls: payload.tls,
			capabilities: payload.capabilities
		});
	}
	async remove(id) {
		return await this.resend.delete(`/domains/${id}`);
	}
	async verify(id) {
		return await this.resend.post(`/domains/${id}/verify`);
	}
};

//#endregion
//#region src/emails/attachments/attachments.ts
var Attachments$1 = class {
	constructor(resend) {
		this.resend = resend;
	}
	async get(options) {
		const { emailId, id } = options;
		return await this.resend.get(`/emails/${emailId}/attachments/${id}`);
	}
	async list(options) {
		const { emailId } = options;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/${emailId}/attachments?${queryString}` : `/emails/${emailId}/attachments`;
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/receiving/attachments/attachments.ts
var Attachments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async get(options) {
		const { emailId, id } = options;
		return await this.resend.get(`/emails/receiving/${emailId}/attachments/${id}`);
	}
	async list(options) {
		const { emailId } = options;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/receiving/${emailId}/attachments?${queryString}` : `/emails/receiving/${emailId}/attachments`;
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/receiving/receiving.ts
var Receiving = class {
	constructor(resend) {
		this.resend = resend;
		this.attachments = new Attachments(resend);
	}
	async get(id) {
		return await this.resend.get(`/emails/receiving/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/receiving?${queryString}` : "/emails/receiving";
		return await this.resend.get(url);
	}
	async forward(options) {
		const { emailId, to, from } = options;
		const passthrough = options.passthrough !== false;
		const emailResponse = await this.get(emailId);
		if (emailResponse.error) return {
			data: null,
			error: emailResponse.error,
			headers: emailResponse.headers
		};
		const email = emailResponse.data;
		const originalSubject = email.subject || "(no subject)";
		if (passthrough) return this.forwardPassthrough(email, {
			to,
			from,
			subject: originalSubject
		});
		const forwardSubject = originalSubject.startsWith("Fwd:") ? originalSubject : `Fwd: ${originalSubject}`;
		return this.forwardWrapped(email, {
			to,
			from,
			subject: forwardSubject,
			text: "text" in options ? options.text : void 0,
			html: "html" in options ? options.html : void 0
		});
	}
	async forwardPassthrough(email, options) {
		const { to, from, subject } = options;
		if (!email.raw?.download_url) return {
			data: null,
			error: {
				name: "validation_error",
				message: "Raw email content is not available for this email",
				statusCode: 400
			},
			headers: null
		};
		const rawResponse = await fetch(email.raw.download_url);
		if (!rawResponse.ok) return {
			data: null,
			error: {
				name: "application_error",
				message: "Failed to download raw email content",
				statusCode: rawResponse.status
			},
			headers: null
		};
		const rawEmailContent = await rawResponse.text();
		const parsed = await PostalMime.parse(rawEmailContent, { attachmentEncoding: "base64" });
		const attachments = parsed.attachments.map((attachment) => {
			const contentId = attachment.contentId ? attachment.contentId.replace(/^<|>$/g, "") : void 0;
			return {
				filename: attachment.filename,
				content: attachment.content.toString(),
				content_type: attachment.mimeType,
				content_id: contentId || void 0
			};
		});
		return await this.resend.post("/emails", {
			from,
			to,
			subject,
			text: parsed.text || void 0,
			html: parsed.html || void 0,
			attachments: attachments.length > 0 ? attachments : void 0
		});
	}
	async forwardWrapped(email, options) {
		const { to, from, subject, text, html } = options;
		if (!email.raw?.download_url) return {
			data: null,
			error: {
				name: "validation_error",
				message: "Raw email content is not available for this email",
				statusCode: 400
			},
			headers: null
		};
		const rawResponse = await fetch(email.raw.download_url);
		if (!rawResponse.ok) return {
			data: null,
			error: {
				name: "application_error",
				message: "Failed to download raw email content",
				statusCode: rawResponse.status
			},
			headers: null
		};
		const rawEmailContent = await rawResponse.text();
		return await this.resend.post("/emails", {
			from,
			to,
			subject,
			text,
			html,
			attachments: [{
				filename: "forwarded_message.eml",
				content: Buffer.from(rawEmailContent).toString("base64"),
				content_type: "message/rfc822"
			}]
		});
	}
};

//#endregion
//#region src/emails/emails.ts
var Emails = class {
	constructor(resend) {
		this.resend = resend;
		this.attachments = new Attachments$1(resend);
		this.receiving = new Receiving(resend);
	}
	async send(payload, options = {}) {
		return this.create(payload, options);
	}
	async create(payload, options = {}) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.post("/emails", parseEmailToApiOptions(payload), options);
	}
	async get(id) {
		return await this.resend.get(`/emails/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails?${queryString}` : "/emails";
		return await this.resend.get(url);
	}
	async update(payload) {
		return await this.resend.patch(`/emails/${payload.id}`, { scheduled_at: payload.scheduledAt });
	}
	async cancel(id) {
		return await this.resend.post(`/emails/${id}/cancel`);
	}
};

//#endregion
//#region src/segments/segments.ts
var Segments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/segments", payload, options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/segments?${queryString}` : "/segments";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/segments/${id}`);
	}
	async remove(id) {
		return await this.resend.delete(`/segments/${id}`);
	}
};

//#endregion
//#region src/common/utils/get-pagination-query-properties.ts
function getPaginationQueryProperties(options = {}) {
	const query = new URLSearchParams();
	if (options.before) query.set("before", options.before);
	if (options.after) query.set("after", options.after);
	if (options.limit) query.set("limit", options.limit.toString());
	return query.size > 0 ? `?${query.toString()}` : "";
}

//#endregion
//#region src/common/utils/parse-template-to-api-options.ts
function parseVariables(variables) {
	return variables?.map((variable) => ({
		key: variable.key,
		type: variable.type,
		fallback_value: variable.fallbackValue
	}));
}
function parseTemplateToApiOptions(template) {
	return {
		name: "name" in template ? template.name : void 0,
		subject: template.subject,
		html: template.html,
		text: template.text,
		alias: template.alias,
		from: template.from,
		reply_to: template.replyTo,
		variables: parseVariables(template.variables)
	};
}

//#endregion
//#region src/templates/chainable-template-result.ts
var ChainableTemplateResult = class {
	constructor(promise, publishFn) {
		this.promise = promise;
		this.publishFn = publishFn;
	}
	then(onfulfilled, onrejected) {
		return this.promise.then(onfulfilled, onrejected);
	}
	async publish() {
		const { data, error } = await this.promise;
		if (error) return {
			data: null,
			headers: null,
			error
		};
		return this.publishFn(data.id);
	}
};

//#endregion
//#region src/templates/templates.ts
var Templates = class {
	constructor(resend) {
		this.resend = resend;
	}
	create(payload) {
		return new ChainableTemplateResult(this.performCreate(payload), this.publish.bind(this));
	}
	async performCreate(payload) {
		if (payload.react) {
			if (!this.renderAsync) try {
				const { renderAsync } = await import('../../chunks/render_resend_Bs-YE6Qm.mjs');
				this.renderAsync = renderAsync;
			} catch {
				throw new Error("Failed to render React component. Make sure to install `@react-email/render`");
			}
			payload.html = await this.renderAsync(payload.react);
		}
		return this.resend.post("/templates", parseTemplateToApiOptions(payload));
	}
	async remove(identifier) {
		return await this.resend.delete(`/templates/${identifier}`);
	}
	async get(identifier) {
		return await this.resend.get(`/templates/${identifier}`);
	}
	async list(options = {}) {
		return this.resend.get(`/templates${getPaginationQueryProperties(options)}`);
	}
	duplicate(identifier) {
		return new ChainableTemplateResult(this.resend.post(`/templates/${identifier}/duplicate`), this.publish.bind(this));
	}
	async publish(identifier) {
		return await this.resend.post(`/templates/${identifier}/publish`);
	}
	async update(identifier, payload) {
		return await this.resend.patch(`/templates/${identifier}`, parseTemplateToApiOptions(payload));
	}
};

//#endregion
//#region src/topics/topics.ts
var Topics = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload) {
		const { defaultSubscription, ...body } = payload;
		return await this.resend.post("/topics", {
			...body,
			default_subscription: defaultSubscription
		});
	}
	async list() {
		return await this.resend.get("/topics");
	}
	async get(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.get(`/topics/${id}`);
	}
	async update(payload) {
		if (!payload.id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.patch(`/topics/${payload.id}`, payload);
	}
	async remove(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.delete(`/topics/${id}`);
	}
};

//#endregion
//#region src/webhooks/webhooks.ts
var Webhooks = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/webhooks", payload, options);
	}
	async get(id) {
		return await this.resend.get(`/webhooks/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/webhooks?${queryString}` : "/webhooks";
		return await this.resend.get(url);
	}
	async update(id, payload) {
		return await this.resend.patch(`/webhooks/${id}`, payload);
	}
	async remove(id) {
		return await this.resend.delete(`/webhooks/${id}`);
	}
	verify(payload) {
		return new Webhook(payload.webhookSecret).verify(payload.payload, {
			"svix-id": payload.headers.id,
			"svix-timestamp": payload.headers.timestamp,
			"svix-signature": payload.headers.signature
		});
	}
};

//#endregion
//#region src/resend.ts
const defaultBaseUrl = "https://api.resend.com";
const defaultUserAgent = `resend-node:${version}`;
const baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
const userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
	constructor(key) {
		this.key = key;
		this.apiKeys = new ApiKeys(this);
		this.segments = new Segments(this);
		this.audiences = this.segments;
		this.batch = new Batch(this);
		this.broadcasts = new Broadcasts(this);
		this.contacts = new Contacts(this);
		this.contactProperties = new ContactProperties(this);
		this.domains = new Domains(this);
		this.emails = new Emails(this);
		this.webhooks = new Webhooks(this);
		this.templates = new Templates(this);
		this.topics = new Topics(this);
		if (!key) {
			if (typeof process !== "undefined" && process.env) this.key = process.env.RESEND_API_KEY;
			if (!this.key) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
		}
		this.headers = new Headers({
			Authorization: `Bearer ${this.key}`,
			"User-Agent": userAgent,
			"Content-Type": "application/json"
		});
	}
	async fetchRequest(path, options = {}) {
		try {
			const response = await fetch(`${baseUrl}${path}`, options);
			if (!response.ok) try {
				const rawError = await response.text();
				return {
					data: null,
					error: JSON.parse(rawError),
					headers: Object.fromEntries(response.headers.entries())
				};
			} catch (err) {
				if (err instanceof SyntaxError) return {
					data: null,
					error: {
						name: "application_error",
						statusCode: response.status,
						message: "Internal server error. We are unable to process your request right now, please try again later."
					},
					headers: Object.fromEntries(response.headers.entries())
				};
				const error = {
					message: response.statusText,
					statusCode: response.status,
					name: "application_error"
				};
				if (err instanceof Error) return {
					data: null,
					error: {
						...error,
						message: err.message
					},
					headers: Object.fromEntries(response.headers.entries())
				};
				return {
					data: null,
					error,
					headers: Object.fromEntries(response.headers.entries())
				};
			}
			return {
				data: await response.json(),
				error: null,
				headers: Object.fromEntries(response.headers.entries())
			};
		} catch {
			return {
				data: null,
				error: {
					name: "application_error",
					statusCode: null,
					message: "Unable to fetch data. The request could not be resolved."
				},
				headers: null
			};
		}
	}
	async post(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
		const requestOptions = {
			method: "POST",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async get(path, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "GET",
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async put(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "PUT",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async patch(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "PATCH",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async delete(path, query) {
		const requestOptions = {
			method: "DELETE",
			body: JSON.stringify(query),
			headers: this.headers
		};
		return this.fetchRequest(path, requestOptions);
	}
};

const POST = async ({ request }) => {
  try {
    const apiKey = "re_XJzPTrfZ_2jmrPp8soVn6g5No95uRVoSH";
    const audienceId = undefined                                   || process.env.RESEND_AUDIENCE_ID || "";
    if (!apiKey) ;
    const resend = new Resend(apiKey);
    const body = await request.json();
    const { email, airport } = body;
    if (!email || !airport) {
      return new Response(JSON.stringify({ error: "Email and airport are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log(`Attempting signup for: ${email} from ${airport}`);
    if (audienceId) {
      try {
        await resend.contacts.create({
          email,
          audienceId,
          unsubscribed: false
          // Removed firstName and lastName empty strings as Resend API rejects them
        });
        console.log(`Contact added to audience ${audienceId}`);
      } catch (contactErr) {
        console.warn("Failed to add contact (user might exist or invalid payload):", contactErr.message || contactErr);
      }
    }
    try {
      const { data, error } = await resend.emails.send({
        from: "Texas Cheap Flights <waitlist@texascheapflights.com>",
        to: email,
        subject: "✈️ You're on the list, Texas traveler.",
        html: buildWelcomeEmail({ airport })
      });
      if (error) {
        console.error("Resend email error:", error);
        throw new Error(error.message);
      }
      console.log("Welcome email sent successfully:", data?.id);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      return new Response(JSON.stringify({
        error: "Email delivery failed.",
        details: emailErr.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("CATCH: Subscribe error:", err);
    return new Response(JSON.stringify({
      error: "Subscription failed.",
      details: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
function buildWelcomeEmail({ airport }) {
  const airportLabel = {
    MFE: "McAllen–Miller International (MFE)",
    LRD: "Laredo International (LRD)",
    HRL: "Valley International (HRL)",
    BRO: "South Padre Island International (BRO)",
    CRP: "Corpus Christi International (CRP)",
    SAT: "San Antonio International (SAT)",
    DFW: "Dallas/Fort Worth International (DFW)",
    IAH: "Houston George Bush Intercontinental (IAH)",
    AUS: "Austin-Bergstrom International (AUS)"
  };
  const airportName = airportLabel[airport] ?? airport;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Texas Cheap Flights</title>
</head>
<body style="margin:0;padding:0;background:#050a14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050a14;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1832 0%,#050a14 100%);border:1px solid rgba(255,255,255,0.08);border-radius:32px 32px 0 0;padding:40px 48px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:#d4a843;">Texas Cheap Flights</p>
              <h1 style="margin:0;font-size:36px;font-weight:900;color:#ffffff;line-height:1.1;">You're on the list,<br/><span style="color:#d4a843;font-style:italic;">Texas traveler.</span></h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0d1832;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);padding:40px 48px;">
              <p style="margin:0 0 24px;color:#94a3b8;font-size:16px;line-height:1.7;">
                Hey! We're building the first points intelligence platform built <em>specifically for Texas regional flyers</em>.
                Most travel hacking advice is written for people in New York. We're fixing that.
              </p>

              <!-- Airport callout -->
              <div style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);border-radius:16px;padding:20px 24px;margin:0 0 32px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#0ea5e9;">Your Home Airport</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${airportName}</p>
                <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">We'll track the best sweet spots departing from your area.</p>
              </div>

              <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#f8fafc;">Here's what you get as a <span style="color:#d4a843;">Founding Member:</span></p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="padding:8px 12px 8px 0;vertical-align:top;"><span style="display:inline-block;width:6px;height:6px;background:#d4a843;border-radius:50%;margin-top:6px;"></span></td>
                  <td style="padding:8px 0;color:#94a3b8;font-size:15px;line-height:1.6;"><strong style="color:#f8fafc;">Monthly TX Points Digest</strong> — The top 3 sweet spots from Texas airports, hand-curated.</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px 8px 0;vertical-align:top;"><span style="display:inline-block;width:6px;height:6px;background:#d4a843;border-radius:50%;margin-top:6px;"></span></td>
                  <td style="padding:8px 0;color:#94a3b8;font-size:15px;line-height:1.6;"><strong style="color:#f8fafc;">Founding Member Access</strong> — Early access to the full platform before public launch.</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px 8px 0;vertical-align:top;"><span style="display:inline-block;width:6px;height:6px;background:#d4a843;border-radius:50%;margin-top:6px;"></span></td>
                  <td style="padding:8px 0;color:#94a3b8;font-size:15px;line-height:1.6;"><strong style="color:#f8fafc;">The Skeptic's Guide</strong> — The bank math behind travel hacking, written for Texas flyers.</td>
                </tr>
              </table>

              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                In the meantime, read the <a href="https://texascheapflights.co/skeptics-guide" style="color:#0ea5e9;text-decoration:none;font-weight:600;">Skeptic's Guide</a> — the best crash course on why Texas flyers have an edge nobody is talking about.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#050a14;border:1px solid rgba(255,255,255,0.05);border-radius:0 0 32px 32px;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 8px;color:#334155;font-size:11px;">© 2026 Texas Cheap Flights. No spam, ever.</p>
              <p style="margin:0;color:#334155;font-size:11px;">
                <a href="#" style="color:#475569;text-decoration:none;">Unsubscribe</a> ·
                <a href="https://texascheapflights.co/skeptics-guide" style="color:#475569;text-decoration:none;">Skeptic's Guide</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
