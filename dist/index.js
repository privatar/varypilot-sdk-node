// packages/contracts/dist/experience.js
var object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function parseExperience(value) {
  if (!object(value) || Object.keys(value).some((k) => ![
    "mode",
    "pages",
    "audience",
    "schedule",
    "exclusion",
    "factors",
    "guardrail"
  ].includes(k)))
    throw new Error("Invalid experience settings.");
  if (value.mode !== void 0 && !["ab", "multipage", "multivariate", "personalization"].includes(String(value.mode)))
    throw new Error("Choose a supported experience type.");
  if (value.pages !== void 0 && (!Array.isArray(value.pages) || value.pages.length > 20 || value.pages.some((p) => !object(p) || typeof p.url !== "string" || !p.url.trim() || p.url.length > 2048 || !["contains", "equals", "starts-with"].includes(String(p.match)))))
    throw new Error("Use up to 20 valid page rules.");
  if (value.audience !== void 0 && (!Array.isArray(value.audience) || value.audience.length > 20 || value.audience.some((r) => !object(r) || typeof r.key !== "string" || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(r.key) || !["eq", "neq", "contains", "gte", "lte", "exists"].includes(String(r.operator)) || !["string", "number", "boolean"].includes(typeof r.value) || typeof r.value === "string" && r.value.length > 200 || typeof r.value === "number" && !Number.isFinite(r.value))))
    throw new Error("Use up to 20 valid audience conditions.");
  if (value.schedule !== void 0) {
    const s = value.schedule;
    if (!object(s) || Object.keys(s).some((k) => !["startsAt", "endsAt"].includes(k)) || [s.startsAt, s.endsAt].some((d) => d !== void 0 && (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(d) || !Number.isFinite(Date.parse(d)))) || s.startsAt && s.endsAt && Date.parse(String(s.startsAt)) >= Date.parse(String(s.endsAt)))
      throw new Error("Choose a start before the end of the schedule.");
  }
  if (value.exclusion !== void 0) {
    const e = value.exclusion;
    if (!object(e) || typeof e.group !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(e.group) || !Number.isInteger(e.from) || !Number.isInteger(e.to) || Number(e.from) < 0 || Number(e.to) > 1e4 || Number(e.from) >= Number(e.to))
      throw new Error("Use a group name and a nonempty bucket range between 0 and 100%.");
  }
  if (value.factors !== void 0) {
    const f = value.factors;
    if (!Array.isArray(f) || f.length > 4 || f.some((x) => !object(x) || typeof x.name !== "string" || !x.name.trim() || x.name.length > 64 || !Array.isArray(x.options) || x.options.length < 2 || x.options.length > 8 || x.options.some((o) => typeof o !== "string" || !o.trim() || o.length > 64) || new Set(x.options).size !== x.options.length) || new Set(f.map((x) => x.name)).size !== f.length || f.reduce((n, x) => n * x.options.length, 1) > 16)
      throw new Error("Use unique factors with 2\u20138 options and at most 16 combinations.");
  }
  if (value.guardrail !== void 0) {
    const g = value.guardrail;
    if (!object(g) || typeof g.enabled !== "boolean" || !["notify", "pause"].includes(String(g.action)) || !Number.isInteger(g.minimumVisitors) || Number(g.minimumVisitors) < 100 || Number(g.minimumVisitors) > 1e7 || typeof g.lossPercent !== "number" || g.lossPercent < 1 || g.lossPercent > 99)
      throw new Error("Choose a loss threshold from 1\u201399% and at least 100 visitors per variation.");
  }
  return structuredClone(value);
}
function matchesAudience(rules, attributes = {}) {
  return (rules ?? []).every((rule) => {
    const present = Object.hasOwn(attributes, rule.key);
    const value = attributes[rule.key];
    if (rule.operator === "exists")
      return present === (rule.value === true || rule.value === "true");
    if (!present)
      return false;
    switch (rule.operator) {
      case "eq":
        return value === rule.value;
      case "neq":
        return value !== rule.value;
      case "contains":
        return typeof value === "string" && typeof rule.value === "string" && value.includes(rule.value);
      case "gte":
        return typeof value === "number" && typeof rule.value === "number" && value >= rule.value;
      case "lte":
        return typeof value === "number" && typeof rule.value === "number" && value <= rule.value;
      default:
        return false;
    }
  });
}
function withinSchedule(schedule, now = Date.now()) {
  return (!schedule?.startsAt || now >= Date.parse(schedule.startsAt)) && (!schedule?.endsAt || now < Date.parse(schedule.endsAt));
}

// packages/contracts/dist/runtime.js
var encode = new TextEncoder();
function object2(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function keys(value, allowed) {
  return Object.keys(value).every((k) => allowed.includes(k));
}
function validIdentifier(value) {
  if (typeof value !== "string" || !value || encode.encode(value).length > 512)
    return false;
  for (let i = 0; i < value.length; i++) {
    const n = value.charCodeAt(i);
    if (n >= 55296 && n <= 56319) {
      const next = value.charCodeAt(++i);
      if (!(next >= 56320 && next <= 57343))
        return false;
    } else if (n >= 56320 && n <= 57343)
      return false;
  }
  return true;
}
function integer(value, min, max) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}
function parseExperiment(input) {
  if (!object2(input) || !keys(input, [
    "id",
    "key",
    "status",
    "allocationVersion",
    "trafficAllocation",
    "variants",
    "targeting",
    "experience"
  ]) || !validIdentifier(input.id) || !validIdentifier(input.key) || !["draft", "running", "paused", "completed"].includes(String(input.status)) || !integer(input.allocationVersion, 1, 2147483647) || !integer(input.trafficAllocation, 0, 1e4) || !Array.isArray(input.variants) || input.variants.length < 2 || input.variants.length > 16)
    throw new TypeError("Invalid experiment");
  let sum = 0;
  const seen = /* @__PURE__ */ new Set();
  for (const v of input.variants) {
    if (!object2(v) || !keys(v, ["key", "weight", "payload"]) || !validIdentifier(v.key) || !integer(v.weight, 0, 1e4) || seen.has(v.key) || v.payload !== void 0 && !object2(v.payload))
      throw new TypeError("Invalid variation");
    sum += v.weight;
    seen.add(v.key);
  }
  if (sum !== 1e4)
    throw new TypeError("Weights must total 10000");
  if (input.targeting !== void 0) {
    const t = input.targeting;
    if (!object2(t) || !keys(t, ["url", "match"]) || typeof t.url !== "string" || t.url.length > 2048 || !["contains", "equals", "starts-with"].includes(String(t.match)))
      throw new TypeError("Invalid targeting");
  }
  if (input.experience !== void 0)
    parseExperience(input.experience);
  return input;
}
function parsePublicConfig(input) {
  if (!object2(input) || !keys(input, [
    "schemaVersion",
    "projectKey",
    "environment",
    "version",
    "experiments"
  ]) || input.schemaVersion !== 1 && input.schemaVersion !== 2 || typeof input.projectKey !== "string" || !/^pk_[A-Za-z0-9_-]{16,128}$/.test(input.projectKey) || typeof input.environment !== "string" || !/^[a-z][a-z0-9-]{1,47}$/.test(input.environment) || !integer(input.version, 1, Number.MAX_SAFE_INTEGER) || !Array.isArray(input.experiments) || input.experiments.length > 1e3)
    throw new TypeError("Invalid snapshot");
  const ids = /* @__PURE__ */ new Set(), experimentKeys = /* @__PURE__ */ new Set();
  for (const item of input.experiments) {
    const e = parseExperiment(item);
    if (ids.has(e.id) || experimentKeys.has(e.key))
      throw new TypeError("Duplicate experiment");
    ids.add(e.id);
    experimentKeys.add(e.key);
  }
  const version = input.experiments.some((e) => e.experience !== void 0) ? 2 : 1;
  if (input.schemaVersion !== version)
    throw new TypeError("Snapshot version must match its experience capabilities");
  return input;
}
function parseTrackingEvent(input) {
  if (!object2(input) || !keys(input, [
    "eventId",
    "type",
    "visitorId",
    "occurredAt",
    "experimentId",
    "variant",
    "allocationVersion",
    "name",
    "value",
    "currency"
  ]) || typeof input.eventId !== "string" || input.eventId.length < 1 || input.eventId.length > 200 || !validIdentifier(input.visitorId) || typeof input.occurredAt !== "string" || !Number.isFinite(Date.parse(input.occurredAt)) || !["exposure", "conversion", "custom"].includes(String(input.type)))
    throw new TypeError("Invalid event");
  if (input.type === "exposure" && (!validIdentifier(input.experimentId) || !validIdentifier(input.variant) || !integer(input.allocationVersion, 1, 2147483647)))
    throw new TypeError("Invalid exposure");
  if (input.type !== "exposure" && (typeof input.name !== "string" || !input.name || input.name.length > 128))
    throw new TypeError("Invalid event name");
  if (input.currency !== void 0 && (typeof input.currency !== "string" || !/^[A-Z]{3}$/.test(input.currency)))
    throw new TypeError("Invalid currency");
  if (input.value !== void 0 && (!integer(input.value, 0, 1e12) || !input.currency))
    throw new TypeError("Invalid revenue");
  return input;
}
function matchesTarget(url, target) {
  if (!target?.url)
    return true;
  if (!url)
    return false;
  return target.match === "equals" ? url === target.url : target.match === "starts-with" ? url.startsWith(target.url) : url.includes(target.url);
}

// packages/core/dist/index.js
import { sha256 } from "@noble/hashes/sha2.js";
var BUCKET_COUNT = 1e4;
var encoder = new TextEncoder();
function canonicalSeed(domain, experimentId, allocationVersion, visitorId) {
  if (domain !== "traffic" && domain !== "variant")
    throw new TypeError("Invalid hash domain");
  if (!validIdentifier(experimentId) || !validIdentifier(visitorId))
    throw new TypeError("Invalid identifier");
  if (!Number.isInteger(allocationVersion) || allocationVersion < 1 || allocationVersion > 2147483647) {
    throw new TypeError("Invalid allocation version");
  }
  const fields = [
    "vexo:assignment:v1",
    domain,
    experimentId,
    String(allocationVersion),
    visitorId
  ];
  return encoder.encode(fields.map((field) => `${encoder.encode(field).length}:${field}`).join(""));
}
function hashBucket(seed) {
  const hash = sha256(seed);
  const unsigned = new DataView(hash.buffer, hash.byteOffset, hash.byteLength).getUint32(0, false);
  return unsigned % BUCKET_COUNT;
}
function compileExperiment(input) {
  const experiment = parseExperiment(structuredClone(input));
  return (visitorId) => evaluateValidated(experiment, visitorId);
}
function evaluateValidated(experiment, visitorId) {
  if (!validIdentifier(visitorId) || experiment.status !== "running")
    return null;
  const traffic = hashBucket(canonicalSeed("traffic", experiment.id, experiment.allocationVersion, visitorId));
  if (traffic >= experiment.trafficAllocation)
    return null;
  const variantBucket = hashBucket(canonicalSeed("variant", experiment.id, experiment.allocationVersion, visitorId));
  let upperBound = 0;
  for (const variant of experiment.variants) {
    upperBound += variant.weight;
    if (variantBucket < upperBound)
      return variant.key;
  }
  return null;
}

// packages/sdk-common/dist/index.js
var ABClient = class {
  eventDiagnostic(_entry, _event) {
  }
  reportEvent(state, event, detail) {
    try {
      this.eventDiagnostic({
        time: (/* @__PURE__ */ new Date()).toISOString(),
        state,
        name: event.name ?? event.experimentId ?? "exposure",
        kind: event.type ?? "conversion",
        ...event.value !== void 0 ? { value: event.value } : {},
        ...event.currency ? { currency: event.currency } : {},
        ...detail ? { detail } : {}
      }, event);
    } catch {
    }
  }
  options;
  config = null;
  evaluators = /* @__PURE__ */ new Map();
  queue = [];
  exposures = /* @__PURE__ */ new Set();
  etag = "";
  timer;
  flushing;
  refreshing;
  consent;
  initialized = false;
  admissionRequired = false;
  accessUntil = Number.POSITIVE_INFINITY;
  admittedUntil = 0;
  accessSnapshot() {
    return {
      required: this.admissionRequired,
      until: Number.isFinite(this.accessUntil) ? this.accessUntil : null
    };
  }
  restoreAccess(access) {
    this.admissionRequired = access.required;
    this.accessUntil = access.until ?? Number.POSITIVE_INFINITY;
  }
  readAccess(headers) {
    const required = headers.get("X-Varypilot-Admission-Required");
    if (required !== null)
      this.admissionRequired = required === "true";
    const until = headers.get("X-Varypilot-Access-Until");
    if (until !== null)
      this.accessUntil = until ? Date.parse(until) : Number.POSITIVE_INFINITY;
  }
  async authorizeAdmission() {
    if (!this.admissionRequired)
      return;
    if (this.admittedUntil > Date.now())
      return;
    this.admittedUntil = 0;
    try {
      const response = await (this.options.fetch ?? fetch)(`${this.options.endpoint.replace(/\/$/, "")}/v1/admission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.options.serverKey ? { Authorization: `Bearer ${this.options.serverKey}` } : {}
        },
        body: JSON.stringify({
          projectKey: this.options.projectKey,
          environment: this.options.environment,
          visitorId: this.options.visitorId
        }),
        signal: AbortSignal.timeout(4e3)
      });
      if (!response.ok)
        return;
      const result = await response.json();
      if (result.allowed === true && typeof result.expiresAt === "number")
        this.admittedUntil = result.expiresAt;
    } catch {
    }
  }
  accessAllowed() {
    return this.initialized && Date.now() < this.accessUntil && (!this.admissionRequired || this.admittedUntil > Date.now());
  }
  constructor(options) {
    const url = new URL(options.endpoint);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
      throw new Error("SDK endpoints require HTTPS");
    this.options = options;
    this.consent = options.consent === true;
    if (options.config) {
      this.acceptConfig(options.config);
      this.initialized = true;
    }
  }
  acceptConfig(input) {
    let data;
    try {
      data = parsePublicConfig(structuredClone(input));
    } catch {
      return false;
    }
    const result = { data };
    if (data.projectKey !== this.options.projectKey || data.environment !== this.options.environment)
      return false;
    if (this.config && this.config.version > result.data.version)
      return false;
    this.config = result.data;
    this.evaluators = new Map(result.data.experiments.map((e) => [e.key, compileExperiment(e)]));
    return true;
  }
  getConfig() {
    return this.config;
  }
  async init() {
    await this.refresh();
    this.initialized = true;
    this.start();
    return this;
  }
  start() {
    if (this.timer)
      return;
    this.timer = setInterval(() => {
      void this.refresh();
      void this.flush().catch(() => {
      });
    }, Math.max(1e3, this.options.refreshIntervalMs ?? 6e4));
    this.timer.unref?.();
  }
  async refresh() {
    if (this.refreshing)
      return this.refreshing;
    this.refreshing = this.download().then(() => this.authorizeAdmission()).finally(() => {
      this.refreshing = void 0;
    });
    return this.refreshing;
  }
  async download() {
    try {
      const res = await (this.options.fetch ?? fetch)(`${this.options.endpoint.replace(/\/$/, "")}/v1/config/${encodeURIComponent(this.options.projectKey)}/${encodeURIComponent(this.options.environment)}`, {
        headers: this.etag ? { "If-None-Match": this.etag } : {},
        signal: AbortSignal.timeout(4e3)
      });
      this.readAccess(res.headers);
      if (res.status === 304)
        return;
      if (res.ok && this.acceptConfig(await res.json()))
        this.etag = res.headers.get("etag") ?? "";
    } catch {
    }
  }
  setAttributes(attributes) {
    this.options.attributes = { ...attributes };
  }
  getPayload(experimentKey) {
    const variant = this.getVariant(experimentKey, "");
    return this.config?.experiments.find((e) => e.key === experimentKey)?.variants.find((v) => v.key === variant)?.payload ?? null;
  }
  getEligibility(experimentKey) {
    const experiment = this.config?.experiments.find((e) => e.key === experimentKey);
    if (!experiment)
      return {
        page: false,
        audience: false,
        schedule: false,
        exclusion: false,
        eligible: false
      };
    const rules = experiment.experience;
    const page = rules?.pages?.length ? rules.pages.some((p) => matchesTarget(this.options.url, p)) : matchesTarget(this.options.url, experiment.targeting);
    const audience = matchesAudience(rules?.audience, this.options.attributes), schedule = withinSchedule(rules?.schedule);
    let exclusion = true;
    if (rules?.exclusion) {
      const group = rules.exclusion;
      const bucket = hashBucket(canonicalSeed("traffic", `exclusion:${this.options.projectKey}:${this.options.environment}:${group.group}`, 1, this.options.visitorId));
      exclusion = bucket >= group.from && bucket < group.to;
    }
    return {
      page,
      audience,
      schedule,
      exclusion,
      eligible: page && audience && schedule && exclusion
    };
  }
  eligible(experimentKey) {
    return this.getEligibility(experimentKey).eligible;
  }
  getVariant(experimentKey, fallback = "A") {
    if (!this.accessAllowed() || !this.eligible(experimentKey))
      return fallback;
    try {
      return this.evaluators.get(experimentKey)?.(this.options.visitorId) ?? fallback;
    } catch {
      return fallback;
    }
  }
  /** Evaluate an already loaded snapshot without granting delivery or analytics access. */
  getLocalAssignment(experimentKey) {
    const experiment = this.config?.experiments.find((item) => item.key === experimentKey);
    if (!experiment || !this.eligible(experimentKey))
      return null;
    try {
      return this.evaluators.get(experimentKey)?.(this.options.visitorId) ?? null;
    } catch {
      return null;
    }
  }
  setConsent(granted) {
    this.consent = granted;
    if (!granted) {
      this.queue = [];
      this.exposures.clear();
    }
  }
  isParticipant(key) {
    const e = this.config?.experiments.find((e2) => e2.key === key);
    return this.accessAllowed() && !!e && this.eligible(key) && this.evaluators.get(key)?.(this.options.visitorId) != null;
  }
  trackExposure(key, variant) {
    const e = this.config?.experiments.find((e2) => e2.key === key);
    if (!this.consent || !e || !this.isParticipant(key) || this.evaluators.get(key)?.(this.options.visitorId) !== variant)
      return;
    const identity = `${e.id}:${e.allocationVersion}`;
    if (this.exposures.has(identity))
      return;
    const queued = this.enqueue({
      type: "exposure",
      experimentId: e.id,
      variant,
      allocationVersion: e.allocationVersion
    });
    if (!queued)
      return;
    this.exposures.add(identity);
    try {
      this.options.onExposure?.(key, variant);
    } catch {
    }
  }
  track(name, properties = {}) {
    return this.enqueue({ type: "conversion", name, ...properties });
  }
  enqueue(event) {
    if (!this.accessAllowed() || !this.consent || this.queue.length >= 1e3) {
      this.reportEvent("suppressed", event, !this.consent ? "Analytics consent not granted" : !this.accessAllowed() ? "Delivery access unavailable" : "Event queue is full");
      return false;
    }
    try {
      this.queue.push(parseTrackingEvent({
        visitorId: this.options.visitorId,
        occurredAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...event,
        eventId: event.eventId ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, "0")).join("")
      }));
      this.reportEvent("queued", this.queue[this.queue.length - 1]);
      return true;
    } catch {
      this.reportEvent("invalid", event, "Event validation failed");
      return false;
    }
  }
  async flush() {
    if (this.flushing)
      return this.flushing;
    if (!this.consent)
      return;
    this.flushing = this.send().finally(() => {
      this.flushing = void 0;
    });
    return this.flushing;
  }
  async send() {
    while (this.consent && this.queue.length) {
      const batch = [];
      let bytes = 0;
      for (const e of this.queue.slice(0, 100)) {
        const size = new TextEncoder().encode(JSON.stringify(e)).length;
        if (bytes + size > 55e3)
          break;
        batch.push(e);
        bytes += size;
      }
      if (!batch.length)
        return;
      const body = JSON.stringify({
        projectKey: this.options.projectKey,
        environment: this.options.environment,
        events: batch
      });
      let accepted = false;
      for (let attempt = 0; attempt <= Math.min(5, this.options.retryLimit ?? 2); attempt++) {
        if (!this.consent)
          return;
        try {
          const response = await (this.options.fetch ?? fetch)(`${this.options.endpoint.replace(/\/$/, "")}/v1/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...this.options.serverKey ? { Authorization: `Bearer ${this.options.serverKey}` } : {}
            },
            body,
            keepalive: bytes < 55e3,
            signal: AbortSignal.timeout(5e3)
          });
          if (response.status === 202) {
            accepted = true;
            break;
          }
          if (response.status < 500 && response.status !== 429)
            break;
        } catch {
        }
        if (attempt < Math.min(5, this.options.retryLimit ?? 2))
          await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
      if (!accepted) {
        for (const event of batch)
          this.reportEvent("pending", event, "Delivery will retry; the server has not acknowledged this event");
        throw new Error("Event delivery pending; retry flush later");
      }
      for (const event of batch)
        this.reportEvent("accepted", event, "Ingestion accepted (202); aggregation is asynchronous");
      this.queue.splice(0, batch.length);
    }
  }
  async close() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = void 0;
    }
    await this.flush();
  }
};

// packages/sdk-node/src/index.ts
var repositories = /* @__PURE__ */ new Map();
function install(repository, config) {
  if (repository.config && config.version < repository.config.version) return;
  repository.config = config;
  repository.evaluators = new Map(
    config.experiments.map((e) => [e.key, compileExperiment(e)])
  );
}
async function refresh(repository, force = false) {
  if (repository.active) return repository.active;
  if (!force && (repository.config && Date.now() - repository.fetchedAt < repository.interval || Date.now() - repository.attemptedAt < Math.min(5e3, repository.interval)))
    return;
  repository.attemptedAt = Date.now();
  repository.active = (async () => {
    try {
      const response = await repository.fetcher(
        `${repository.endpoint}/v1/config/${encodeURIComponent(repository.projectKey)}/${encodeURIComponent(repository.environment)}`,
        {
          headers: repository.etag ? { "If-None-Match": repository.etag } : {},
          signal: AbortSignal.timeout(4e3)
        }
      );
      repository.accessHeaders = response.headers;
      if (response.status === 304) {
        repository.fetchedAt = Date.now();
        return;
      }
      if (!response.ok) return;
      const config = parsePublicConfig(await response.json());
      if (config.projectKey !== repository.projectKey || config.environment !== repository.environment)
        return;
      install(repository, config);
      repository.etag = response.headers.get("etag") ?? "";
      repository.fetchedAt = Date.now();
    } catch {
    }
  })().finally(() => {
    repository.active = void 0;
  });
  return repository.active;
}
var ServerClient = class extends ABClient {
  repository;
  constructor(options) {
    super(options);
    const endpoint = options.endpoint.replace(/\/$/, ""), key = `${endpoint}|${options.projectKey}|${options.environment}`;
    let repository = repositories.get(key);
    if (!repository) {
      repository = {
        endpoint,
        projectKey: options.projectKey,
        environment: options.environment,
        fetcher: options.fetch ?? fetch,
        interval: Math.max(1e3, options.refreshIntervalMs ?? 6e4),
        config: null,
        evaluators: /* @__PURE__ */ new Map(),
        etag: "",
        fetchedAt: 0,
        attemptedAt: 0,
        accessHeaders: new Headers(),
        active: void 0,
        timer: void 0
      };
      repositories.set(key, repository);
      const shared = repository;
      repository.timer = setInterval(() => {
        void refresh(shared);
      }, repository.interval);
      repository.timer.unref();
    }
    this.repository = repository;
    const initial = super.getConfig();
    if (initial) install(repository, initial);
    this.adopt();
    void refresh(repository);
  }
  adopt() {
    this.readAccess(this.repository.accessHeaders);
    if (this.repository.config) {
      this.config = this.repository.config;
      this.evaluators = this.repository.evaluators;
    }
  }
  start() {
  }
  async refresh(force = false) {
    await refresh(this.repository, force);
    this.adopt();
    this.readAccess(this.repository.accessHeaders);
    await this.authorizeAdmission();
  }
  getVariant(key, fallback = "A") {
    this.adopt();
    return super.getVariant(key, fallback);
  }
  trackExposure(key, variant) {
    this.adopt();
    super.trackExposure(key, variant);
  }
  getConfig() {
    this.adopt();
    const config = super.getConfig();
    return config ? structuredClone(config) : null;
  }
};
var createABServerClient = (options) => new ServerClient(options);
function shutdownABServerSDK() {
  for (const repository of repositories.values())
    if (repository.timer) clearInterval(repository.timer);
  repositories.clear();
}
export {
  ABClient,
  ServerClient,
  createABServerClient,
  shutdownABServerSDK
};
