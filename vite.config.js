var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
function fetchVaktijaDailyData(city, locale) {
    return __awaiter(this, void 0, void 0, function () {
        var cityPageUrl, cityPageResponse, cityPageHtml, buildIdMatch, buildId, dataUrl, dataResponse, payload;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    cityPageUrl = "https://vaktija.eu/".concat(city);
                    return [4 /*yield*/, fetch(cityPageUrl, {
                            headers: {
                                Accept: 'text/html',
                                'User-Agent': 'IKC-Duesseldorf/1.0'
                            }
                        })];
                case 1:
                    cityPageResponse = _g.sent();
                    if (!cityPageResponse.ok) {
                        throw new Error("Failed to load city page (".concat(cityPageResponse.status, ")"));
                    }
                    return [4 /*yield*/, cityPageResponse.text()];
                case 2:
                    cityPageHtml = _g.sent();
                    buildIdMatch = cityPageHtml.match(/"buildId":"([^"]+)"/);
                    if (!(buildIdMatch === null || buildIdMatch === void 0 ? void 0 : buildIdMatch[1])) {
                        throw new Error('Could not detect Vaktija build ID');
                    }
                    buildId = buildIdMatch[1];
                    dataUrl = "https://vaktija.eu/_next/data/".concat(buildId, "/").concat(locale, "/").concat(city, ".json");
                    return [4 /*yield*/, fetch(dataUrl, {
                            headers: {
                                Accept: 'application/json',
                                'User-Agent': 'IKC-Duesseldorf/1.0'
                            }
                        })];
                case 3:
                    dataResponse = _g.sent();
                    if (!dataResponse.ok) {
                        throw new Error("Failed to load Vaktija JSON (".concat(dataResponse.status, ")"));
                    }
                    return [4 /*yield*/, dataResponse.json()];
                case 4:
                    payload = (_g.sent());
                    return [2 /*return*/, {
                            pageProps: {
                                dailyPrayersRes: (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.pageProps) === null || _a === void 0 ? void 0 : _a.dailyPrayersRes) !== null && _b !== void 0 ? _b : null,
                                todayGregorian: (_d = (_c = payload === null || payload === void 0 ? void 0 : payload.pageProps) === null || _c === void 0 ? void 0 : _c.todayGregorian) !== null && _d !== void 0 ? _d : null,
                                todayHijri: (_f = (_e = payload === null || payload === void 0 ? void 0 : payload.pageProps) === null || _e === void 0 ? void 0 : _e.todayHijri) !== null && _f !== void 0 ? _f : null
                            }
                        }];
            }
        });
    });
}
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'vaktija-dev-proxy',
            configureServer: function (server) {
                var _this = this;
                server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                    var payload, _a;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                if (!((_b = req.url) === null || _b === void 0 ? void 0 : _b.startsWith('/api/vaktija/dusseldorf'))) {
                                    next();
                                    return [2 /*return*/];
                                }
                                if (req.method !== 'GET') {
                                    res.statusCode = 405;
                                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                                    res.end(JSON.stringify({ error: 'Method not allowed' }));
                                    return [2 /*return*/];
                                }
                                _c.label = 1;
                            case 1:
                                _c.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, fetchVaktijaDailyData('dusseldorf', 'bs')];
                            case 2:
                                payload = _c.sent();
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                                res.setHeader('Cache-Control', 'public, max-age=120');
                                res.end(JSON.stringify(payload));
                                return [3 /*break*/, 4];
                            case 3:
                                _a = _c.sent();
                                res.statusCode = 502;
                                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                                res.end(JSON.stringify({ error: 'Vaktija proxy unavailable' }));
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
            }
        }
    ]
});
