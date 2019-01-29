define(["require", "exports", "vs/editor/editor.main"], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var Emitter = monaco.Emitter;
    var LanguageServiceDefaultsImpl = /** @class */ (function () {
        function LanguageServiceDefaultsImpl() {
            this._onDidChange = new Emitter();
            this._workerMaxIdleTime = 2 * 60 * 1000;
        }
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "onDidChange", {
            get: function () {
                return this._onDidChange.event;
            },
            enumerable: true,
            configurable: true
        });
        LanguageServiceDefaultsImpl.prototype.setMaximumWorkerIdleTime = function (value) {
            // doesn't fire an event since no
            // worker restart is required here
            this._workerMaxIdleTime = value;
        };
        LanguageServiceDefaultsImpl.prototype.getWorkerMaxIdleTime = function () {
            return this._workerMaxIdleTime;
        };
        return LanguageServiceDefaultsImpl;
    }());
    exports.LanguageServiceDefaultsImpl = LanguageServiceDefaultsImpl;
    var flameDefaults = new LanguageServiceDefaultsImpl();
    function getFlameWorker() {
        return getMode().then(function (mode) { return mode.getWorker(); });
    }
    // Export API
    function createAPI() {
        return {
            flameDefaults: flameDefaults,
            getFlameWorker: getFlameWorker
        };
    }
    monaco.languages.FlameLanguage = createAPI();
    // --- Registration to monaco editor ---
    function getMode() {
        return new Promise(function (resolve_1, reject_1) { require(['flame/mode'], resolve_1, reject_1); });
    }
    [
        'javascript', 'typescript', 'cpp', 'java',
        'go', 'ruby', 'python', 'perl', 'customizedDebugLang'
    ].forEach(function (lang) {
        monaco.languages.onLanguage(lang, function () {
            return getMode().then(function (mode) { return mode.setupFlame(flameDefaults, lang); });
        });
    });
});