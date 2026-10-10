"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FirebaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
let FirebaseService = FirebaseService_1 = class FirebaseService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(FirebaseService_1.name);
        this.app = null;
        this.messaging = null;
        this.initialized = false;
    }
    init() {
        if (this.initialized)
            return;
        this.initialized = true;
        let admin;
        try {
            admin = require('firebase-admin');
        }
        catch {
            this.logger.warn('firebase-admin not installed — push notifications run in log-only mode.');
            return;
        }
        const credsJson = this.config.get('FIREBASE_SERVICE_ACCOUNT_JSON');
        const credsPath = this.config.get('FIREBASE_SERVICE_ACCOUNT');
        let serviceAccount = null;
        try {
            if (credsJson) {
                serviceAccount = JSON.parse(credsJson);
            }
            else if (credsPath && fs.existsSync(credsPath)) {
                serviceAccount = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            }
        }
        catch (e) {
            this.logger.error(`Failed to parse Firebase service account: ${e.message}`);
        }
        if (!serviceAccount) {
            this.logger.warn('No Firebase service account configured — push runs in log-only mode.');
            return;
        }
        try {
            this.app = admin.apps?.length
                ? admin.app()
                : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            this.messaging = this.app.messaging();
            this.logger.log('Firebase Admin initialized — push notifications are live.');
        }
        catch (e) {
            this.logger.error(`Firebase init failed: ${e.message}`);
        }
    }
    get isLive() {
        this.init();
        return !!this.messaging;
    }
    async sendToTokens(tokens, title, body, data = {}) {
        this.init();
        const unique = [...new Set(tokens.filter(Boolean))];
        if (unique.length === 0) {
            return { successCount: 0, failureCount: 0, invalidTokens: [] };
        }
        if (!this.messaging) {
            this.logger.warn(`[DEV push] "${title}" → ${unique.length} token(s): ${body}`);
            return { successCount: unique.length, failureCount: 0, invalidTokens: [] };
        }
        const invalidTokens = [];
        let successCount = 0;
        let failureCount = 0;
        for (let i = 0; i < unique.length; i += 500) {
            const batch = unique.slice(i, i + 500);
            try {
                const res = await this.messaging.sendEachForMulticast({
                    tokens: batch,
                    notification: { title, body },
                    data,
                    android: { priority: 'high' },
                });
                successCount += res.successCount;
                failureCount += res.failureCount;
                res.responses.forEach((r, idx) => {
                    if (!r.success) {
                        const code = r.error?.code || '';
                        if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
                            invalidTokens.push(batch[idx]);
                        }
                    }
                });
            }
            catch (e) {
                failureCount += batch.length;
                this.logger.error(`FCM batch send failed: ${e.message}`);
            }
        }
        return { successCount, failureCount, invalidTokens };
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = FirebaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map