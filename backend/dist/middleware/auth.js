"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new Error();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = yield User_1.User.findById(decoded._id);
        if (!user) {
            throw new Error();
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
});
exports.auth = auth;
const admin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== 'admin') {
            throw new Error();
        }
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'Access denied' });
    }
});
exports.admin = admin;
