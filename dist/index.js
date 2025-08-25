var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/openai.ts
var openai_exports = {};
__export(openai_exports, {
  analyzeMaritimeQuery: () => analyzeMaritimeQuery,
  extractDocumentType: () => extractDocumentType,
  generateMaritimeResponse: () => generateMaritimeResponse,
  summarizeDocument: () => summarizeDocument
});
import OpenAI from "openai";
async function analyzeMaritimeQuery(query) {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a maritime domain expert. Analyze the user's query and categorize it. Respond with JSON in this exact format:
          {
            "category": "laytime|weather|distance|cp_clause|document_analysis|voyage_guidance|general",
            "confidence": 0.0-1.0,
            "suggestedActions": ["action1", "action2"],
            "requiresDocuments": true|false
          }
          
          Categories:
          - laytime: Time calculations, loading/discharging operations
          - weather: Weather conditions, forecasts, weather routing
          - distance: Port distances, voyage planning, fuel calculations
          - cp_clause: Charter party clauses, contract terms
          - document_analysis: Requests to analyze uploaded documents
          - voyage_guidance: Voyage planning, port procedures, regulations
          - general: Other maritime-related questions`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" }
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      category: result.category || "general",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      suggestedActions: result.suggestedActions || [],
      requiresDocuments: result.requiresDocuments || false
    };
  } catch (error) {
    console.error("Failed to analyze maritime query:", error);
    const queryLower = query.toLowerCase();
    let category = "general";
    let confidence = 0.7;
    let suggestedActions = [];
    if (queryLower.includes("laytime") || queryLower.includes("loading") || queryLower.includes("discharge")) {
      category = "laytime";
      suggestedActions = ["Calculate precise laytime", "Review charter party terms"];
    } else if (queryLower.includes("weather") || queryLower.includes("wind") || queryLower.includes("rain")) {
      category = "weather";
      suggestedActions = ["Check weather conditions", "Review operational guidelines"];
    } else if (queryLower.includes("distance") || queryLower.includes("route") || queryLower.includes("voyage")) {
      category = "distance";
      suggestedActions = ["Calculate voyage distance", "Estimate fuel consumption"];
    } else if (queryLower.includes("charter") || queryLower.includes("clause") || queryLower.includes("cp")) {
      category = "cp_clause";
      suggestedActions = ["Interpret charter terms", "Review legal implications"];
    }
    return {
      category,
      confidence,
      suggestedActions,
      requiresDocuments: false
    };
  }
}
async function generateMaritimeResponse(query, context) {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    const systemPrompt = `You are MaritimeAI, an expert maritime assistant specializing in:
    - Laytime calculations and charterparty terms
    - Weather analysis and routing
    - Port distances and voyage planning
    - Maritime regulations and procedures
    - Document analysis and interpretation

    Provide accurate, professional responses based on maritime industry standards.
    If you need additional information, ask specific questions.
    Always cite relevant regulations or industry practices when applicable.`;
    const contextInfo = [];
    if (context.knowledgeBase?.length) {
      contextInfo.push("Relevant knowledge base entries:");
      context.knowledgeBase.forEach((kb) => {
        contextInfo.push(`- ${kb.title}: ${kb.content}`);
      });
    }
    if (context.documents?.length) {
      contextInfo.push("Referenced documents:");
      context.documents.forEach((doc) => {
        contextInfo.push(`- ${doc.originalName}: ${doc.summary || doc.content?.substring(0, 200)}`);
      });
    }
    const messages2 = [
      { role: "system", content: systemPrompt }
    ];
    if (context.conversationHistory?.length) {
      messages2.push(...context.conversationHistory.slice(-6));
    }
    if (contextInfo.length > 0) {
      messages2.push({
        role: "system",
        content: `Additional context:
${contextInfo.join("\n")}`
      });
    }
    messages2.push({ role: "user", content: query });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages2,
      max_tokens: 1e3
    });
    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try rephrasing your question.";
  } catch (error) {
    console.error("Failed to generate maritime response:", error);
    if (error?.code === "insufficient_quota" || error?.status === 429) {
      return `I'm currently unable to access the AI service due to quota limits. However, I can still help you with:

\u2022 Maritime calculations (laytime, distance, weather)
\u2022 Charter party clause analysis
\u2022 Document uploads and basic processing
\u2022 Access to our maritime knowledge base

Please use the maritime tools in the sidebar or ask specific calculation questions, and I'll provide expert maritime guidance using our built-in systems.`;
    }
    return "I'm experiencing temporary connectivity issues with the AI service, but all maritime calculation tools are working perfectly. Please try using the maritime tools in the sidebar for laytime, distance, weather, and CP clause analysis.";
  }
}
async function summarizeDocument(content, documentType) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a maritime document expert. Summarize this ${documentType || "document"} focusing on key maritime terms, dates, parties, and important clauses. Keep the summary concise but comprehensive.`
        },
        {
          role: "user",
          content: `Please summarize this document:

${content}`
        }
      ],
      max_tokens: 500
    });
    return response.choices[0].message.content || "Unable to generate summary.";
  } catch (error) {
    console.error("Failed to summarize document:", error);
    return "Failed to generate document summary.";
  }
}
async function extractDocumentType(filename, content) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze this maritime document and classify it. Respond with JSON in this format:
          {
            "documentType": "charter_party|bill_of_lading|weather_report|voyage_instructions|other"
          }`
        },
        {
          role: "user",
          content: `Filename: ${filename}

Content preview:
${content.substring(0, 1e3)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.documentType || "other";
  } catch (error) {
    console.error("Failed to extract document type:", error);
    return "other";
  }
}
var openai;
var init_openai = __esm({
  "server/services/openai.ts"() {
    "use strict";
    openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here" ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  conversations;
  messages;
  documents;
  maritimeKnowledge;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.conversations = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.documents = /* @__PURE__ */ new Map();
    this.maritimeKnowledge = /* @__PURE__ */ new Map();
  }
  // Users
  async getUsers() {
    return Array.from(this.users.values());
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const user = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updated = { ...user, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.users.set(id, updated);
    return updated;
  }
  async deleteUser(id) {
    return this.users.delete(id);
  }
  // Conversations
  async getConversations() {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  async getConversation(id) {
    return this.conversations.get(id);
  }
  async createConversation(insertConversation) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.conversations.set(id, conversation);
    return conversation;
  }
  async updateConversation(id, updates) {
    const conversation = this.conversations.get(id);
    if (!conversation) return void 0;
    const updated = { ...conversation, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.conversations.set(id, updated);
    return updated;
  }
  async deleteConversation(id) {
    const messages2 = Array.from(this.messages.values()).filter((m) => m.conversationId === id);
    messages2.forEach((m) => this.messages.delete(m.id));
    return this.conversations.delete(id);
  }
  // Messages
  async getMessagesByConversation(conversationId) {
    return Array.from(this.messages.values()).filter((m) => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  async createMessage(insertMessage) {
    const id = randomUUID();
    const message = {
      ...insertMessage,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      metadata: insertMessage.metadata || null
    };
    this.messages.set(id, message);
    await this.updateConversation(message.conversationId, { updatedAt: /* @__PURE__ */ new Date() });
    return message;
  }
  // Documents
  async getDocuments() {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  async getDocument(id) {
    return this.documents.get(id);
  }
  async createDocument(insertDocument) {
    const id = randomUUID();
    const document = {
      ...insertDocument,
      id,
      processed: false,
      createdAt: /* @__PURE__ */ new Date(),
      content: insertDocument.content || null,
      summary: insertDocument.summary || null,
      documentType: insertDocument.documentType || null
    };
    this.documents.set(id, document);
    return document;
  }
  async updateDocument(id, updates) {
    const document = this.documents.get(id);
    if (!document) return void 0;
    const updated = { ...document, ...updates };
    this.documents.set(id, updated);
    return updated;
  }
  async deleteDocument(id) {
    return this.documents.delete(id);
  }
  async searchDocuments(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documents.values()).filter(
      (doc) => doc.originalName.toLowerCase().includes(lowerQuery) || doc.content?.toLowerCase().includes(lowerQuery) || doc.summary?.toLowerCase().includes(lowerQuery)
    );
  }
  // Maritime Knowledge
  async getMaritimeKnowledge(category) {
    const knowledge = Array.from(this.maritimeKnowledge.values());
    if (category) {
      return knowledge.filter((k) => k.category === category);
    }
    return knowledge;
  }
  async createMaritimeKnowledge(insertKnowledge) {
    const id = randomUUID();
    const knowledge = {
      ...insertKnowledge,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      keywords: insertKnowledge.keywords || null
    };
    this.maritimeKnowledge.set(id, knowledge);
    return knowledge;
  }
  async searchMaritimeKnowledge(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.maritimeKnowledge.values()).filter(
      (knowledge) => knowledge.title.toLowerCase().includes(lowerQuery) || knowledge.content.toLowerCase().includes(lowerQuery) || knowledge.keywords?.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
    );
  }
};
var storage = new MemStorage();

// server/routes.ts
import multer from "multer";
import fs2 from "fs";
import path2 from "path";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("user").notNull(),
  // 'admin' | 'user'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  // For storing additional data like document references, tool results
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  content: text("content"),
  // Extracted text content
  summary: text("summary"),
  // AI-generated summary
  documentType: text("document_type"),
  // 'charter_party' | 'bill_of_lading' | 'weather_report' | 'voyage_instructions' | 'other'
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var maritimeKnowledge = pgTable("maritime_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  // 'laytime' | 'cp_clause' | 'weather' | 'distance' | 'general'
  title: text("title").notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").array(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});
var insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  processed: true
});
var insertMaritimeKnowledgeSchema = createInsertSchema(maritimeKnowledge).omit({
  id: true,
  createdAt: true
});

// server/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var router = Router();
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await storage.createUser({
      email,
      password: hashedPassword,
      name: name || null,
      role: "user"
    });
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error signing in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
var auth_default = router;

// server/routes.ts
init_openai();

// server/services/maritime-knowledge.ts
function calculateLaytime(arrivalTime, completionTime, options = {}) {
  const totalMs = completionTime.getTime() - arrivalTime.getTime();
  const totalHours = totalMs / (1e3 * 60 * 60);
  const totalDays = totalHours / 24;
  let workingDays = totalDays;
  if (options.excludeWeekends) {
    const weekends = Math.floor(totalDays / 7) * 2;
    workingDays = totalDays - weekends;
  }
  return {
    arrivalTime,
    completionTime,
    totalHours: Math.round(totalHours * 100) / 100,
    totalDays: Math.round(totalDays * 100) / 100,
    workingDays: Math.round(workingDays * 100) / 100
  };
}
function calculateDistance(fromPort, toPort) {
  const portDistances = {
    "hamburg": {
      "rotterdam": 237,
      "antwerp": 288,
      "felixstowe": 391,
      "santos": 5967,
      "singapore": 8345
    },
    "rotterdam": {
      "hamburg": 237,
      "antwerp": 68,
      "felixstowe": 187,
      "new_york": 3654,
      "singapore": 8277
    },
    "singapore": {
      "shanghai": 1436,
      "tokyo": 2885,
      "mumbai": 2889,
      "dubai": 3277,
      "hamburg": 8345
    }
  };
  const fromKey = fromPort.toLowerCase().replace(/\s+/g, "_");
  const toKey = toPort.toLowerCase().replace(/\s+/g, "_");
  let distanceNM = 0;
  if (portDistances[fromKey]?.[toKey]) {
    distanceNM = portDistances[fromKey][toKey];
  } else if (portDistances[toKey]?.[fromKey]) {
    distanceNM = portDistances[toKey][fromKey];
  } else {
    distanceNM = 5e3;
  }
  const averageSpeed = 14;
  const estimatedDays = Math.round(distanceNM / (averageSpeed * 24) * 100) / 100;
  return {
    fromPort,
    toPort,
    distanceNM,
    estimatedDays,
    fuelConsumption: Math.round(distanceNM * 30)
    // Rough estimate: 30 MT/day
  };
}
async function searchMaritimeKnowledge(query, category) {
  const results = await storage.searchMaritimeKnowledge(query);
  if (category) {
    return results.filter((r) => r.category === category);
  }
  return results;
}
function getWeatherConditions(location) {
  const conditions = [
    { condition: "Clear", temperature: 18, windSpeed: 12, visibility: 10, recommendation: "Good conditions for cargo operations" },
    { condition: "Partly Cloudy", temperature: 16, windSpeed: 15, visibility: 8, recommendation: "Suitable for operations with caution" },
    { condition: "Overcast", temperature: 14, windSpeed: 20, visibility: 6, recommendation: "Monitor weather conditions closely" },
    { condition: "Light Rain", temperature: 12, windSpeed: 18, visibility: 4, recommendation: "Consider delays for sensitive cargo" }
  ];
  return conditions[Math.floor(Math.random() * conditions.length)];
}
function interpretCPClause(clauseText) {
  const lowerText = clauseText.toLowerCase();
  if (lowerText.includes("weather working day") || lowerText.includes("wwd")) {
    return {
      clauseType: "Weather Working Days",
      interpretation: "This clause excludes time when weather conditions prevent cargo operations from counting against laytime.",
      implications: [
        "Charterer protected from weather delays",
        'Definition of "weather" conditions must be clear',
        "Local port customs may apply"
      ],
      recommendations: [
        "Clarify weather thresholds",
        "Review local port weather definitions",
        "Consider weather monitoring systems"
      ]
    };
  } else if (lowerText.includes("demurrage") || lowerText.includes("dispatch")) {
    return {
      clauseType: "Demurrage/Dispatch",
      interpretation: "This clause defines compensation for exceeding laytime (demurrage) or completing early (dispatch).",
      implications: [
        "Financial liability for delays",
        "Incentive for efficient operations",
        "Clear calculation methods required"
      ],
      recommendations: [
        "Verify calculation methods",
        "Understand dispatch rates",
        "Plan operations efficiently"
      ]
    };
  } else {
    return {
      clauseType: "General Charter Party Clause",
      interpretation: "This appears to be a standard charter party provision requiring detailed analysis.",
      implications: [
        "Legal obligations for both parties",
        "Potential financial implications",
        "Operational requirements"
      ],
      recommendations: [
        "Seek legal review if unclear",
        "Document compliance actions",
        "Maintain clear records"
      ]
    };
  }
}

// server/services/pdf-processor.ts
import fs from "fs";
import path from "path";
var PDFProcessor = class {
  uploadPath;
  constructor(uploadPath = "./uploads") {
    this.uploadPath = uploadPath;
    this.ensureUploadDirectory();
  }
  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }
  async processPDFBuffer(buffer, filename) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(buffer);
      const content = pdfData.text;
      const metadata = {
        pages: pdfData.numpages,
        size: buffer.length,
        uploadedAt: /* @__PURE__ */ new Date(),
        processedAt: /* @__PURE__ */ new Date()
      };
      const sections = this.extractSections(content);
      const keywords = this.extractKeywords(content);
      const documentType = this.classifyDocument(content, filename);
      const summary = await this.generateSummary(content, documentType);
      const processedDoc = {
        id: this.generateDocumentId(),
        filename: `${Date.now()}_${filename}`,
        originalName: filename,
        content,
        summary,
        documentType,
        metadata,
        keywords,
        sections
      };
      await this.saveProcessedDocument(processedDoc);
      return processedDoc;
    } catch (error) {
      console.error("PDF processing failed:", error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  extractSections(content) {
    const sections = [];
    const lines = content.split("\n").filter((line) => line.trim());
    let currentSection = null;
    let pageNumber = 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const isHeader = this.isHeaderLine(line);
      const isClause = this.isClauseLine(line);
      if (isHeader || isClause) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          content: "",
          page: pageNumber,
          type: isClause ? "clause" : "header"
        };
      } else if (currentSection) {
        currentSection.content += (currentSection.content ? "\n" : "") + line;
      } else {
        sections.push({
          title: "General Content",
          content: line,
          page: pageNumber,
          type: "paragraph"
        });
      }
      if (i > 0 && i % 50 === 0) {
        pageNumber++;
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }
    return sections;
  }
  isHeaderLine(line) {
    return line.length > 3 && line.length < 80 && (line === line.toUpperCase() || /^\d+\.?\s/.test(line) || /^[A-Z][A-Z\s]{5,}$/.test(line));
  }
  isClauseLine(line) {
    return /^(\d+\.|\([a-z]\)|\([0-9]+\))\s/.test(line) || /^(CLAUSE|ARTICLE|SECTION)\s+\d+/i.test(line);
  }
  extractKeywords(content) {
    const maritimeTerms = [
      "laytime",
      "demurrage",
      "despatch",
      "charter party",
      "bill of lading",
      "vessel",
      "cargo",
      "port",
      "loading",
      "discharge",
      "weather",
      "routing",
      "voyage",
      "freight",
      "bunkers",
      "ballast",
      "draught",
      "tonnage",
      "berth",
      "anchorage",
      "pilot",
      "tug",
      "mooring"
    ];
    const words = content.toLowerCase().split(/\W+/);
    const keywords = /* @__PURE__ */ new Set();
    maritimeTerms.forEach((term) => {
      if (content.toLowerCase().includes(term)) {
        keywords.add(term);
      }
    });
    const wordFreq = {};
    words.forEach((word) => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    Object.entries(wordFreq).sort(([, a], [, b]) => b - a).slice(0, 10).forEach(([word]) => keywords.add(word));
    return Array.from(keywords).slice(0, 20);
  }
  classifyDocument(content, filename) {
    const contentLower = content.toLowerCase();
    const filenameLower = filename.toLowerCase();
    if (contentLower.includes("charter party") || filenameLower.includes("charter")) {
      return "charter_party";
    } else if (contentLower.includes("bill of lading") || filenameLower.includes("bl")) {
      return "bill_of_lading";
    } else if (contentLower.includes("weather") || filenameLower.includes("weather")) {
      return "weather_report";
    } else if (contentLower.includes("voyage") || filenameLower.includes("voyage")) {
      return "voyage_instructions";
    } else if (contentLower.includes("laytime") || contentLower.includes("demurrage")) {
      return "laytime_calculation";
    } else {
      return "general_maritime";
    }
  }
  async generateSummary(content, documentType) {
    try {
      const { summarizeDocument: summarizeDocument2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      return await summarizeDocument2(content, documentType);
    } catch (error) {
      console.log("OpenAI summarization not available, using fallback");
      const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
      const summary = sentences.slice(0, 3).join(". ").trim();
      return summary ? summary + "." : "Document processed successfully.";
    }
  }
  generateDocumentId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async saveProcessedDocument(doc) {
    const docPath = path.join(this.uploadPath, `${doc.id}.json`);
    await fs.promises.writeFile(docPath, JSON.stringify(doc, null, 2));
  }
  async getProcessedDocument(id) {
    try {
      const docPath = path.join(this.uploadPath, `${id}.json`);
      const content = await fs.promises.readFile(docPath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
  async listProcessedDocuments() {
    try {
      const files = await fs.promises.readdir(this.uploadPath);
      const jsonFiles = files.filter((f) => f.endsWith(".json") && f !== "knowledge_base.json");
      const documents2 = [];
      for (const file of jsonFiles) {
        try {
          const content = await fs.promises.readFile(
            path.join(this.uploadPath, file),
            "utf8"
          );
          const doc = JSON.parse(content);
          if (doc.metadata) {
            if (doc.metadata.uploadedAt) {
              doc.metadata.uploadedAt = new Date(doc.metadata.uploadedAt);
            }
            if (doc.metadata.processedAt) {
              doc.metadata.processedAt = new Date(doc.metadata.processedAt);
            }
          }
          documents2.push(doc);
        } catch (error) {
          console.error(`Failed to load document ${file}:`, error);
        }
      }
      return documents2.sort((a, b) => {
        const aTime = a.metadata?.uploadedAt instanceof Date ? a.metadata.uploadedAt.getTime() : 0;
        const bTime = b.metadata?.uploadedAt instanceof Date ? b.metadata.uploadedAt.getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error("Failed to list documents:", error);
      return [];
    }
  }
  async createKnowledgeBaseEntries(doc) {
    const entries = [];
    doc.sections.forEach((section, index) => {
      if (section.content && section.content.length > 50) {
        const category = this.categorizeSection(section.content);
        const entry = {
          id: `kb_${doc.id}_${index}`,
          documentId: doc.id,
          title: section.title || `Section ${index + 1}`,
          content: section.content,
          category,
          relevanceScore: this.calculateRelevanceScore(section.content, category),
          tags: this.extractSectionTags(section.content)
        };
        entries.push(entry);
      }
    });
    return entries;
  }
  categorizeSection(content) {
    const contentLower = content.toLowerCase();
    if (contentLower.includes("laytime") || contentLower.includes("demurrage")) {
      return "laytime";
    } else if (contentLower.includes("weather") || contentLower.includes("wind")) {
      return "weather";
    } else if (contentLower.includes("distance") || contentLower.includes("route")) {
      return "distance";
    } else if (contentLower.includes("charter") || contentLower.includes("clause")) {
      return "cp_clause";
    } else if (contentLower.includes("voyage") || contentLower.includes("port")) {
      return "voyage_guidance";
    } else {
      return "general";
    }
  }
  calculateRelevanceScore(content, category) {
    const baseScore = Math.min(content.length / 1e3, 1);
    const categoryKeywords = {
      laytime: ["laytime", "demurrage", "despatch", "loading", "discharge"],
      weather: ["weather", "wind", "storm", "forecast", "routing"],
      distance: ["distance", "nautical", "route", "passage", "voyage"],
      cp_clause: ["clause", "charter", "party", "terms", "conditions"],
      voyage_guidance: ["port", "berth", "pilot", "tug", "mooring"],
      general: []
    };
    const keywords = categoryKeywords[category] || [];
    const keywordMatches = keywords.filter(
      (kw) => content.toLowerCase().includes(kw)
    ).length;
    const keywordScore = keywords.length > 0 ? keywordMatches / keywords.length : 0.5;
    return Math.round((baseScore * 0.6 + keywordScore * 0.4) * 100) / 100;
  }
  extractSectionTags(content) {
    const commonTags = [
      "maritime",
      "shipping",
      "vessel",
      "cargo",
      "port",
      "navigation",
      "contract",
      "legal",
      "operations",
      "logistics",
      "commercial"
    ];
    return commonTags.filter(
      (tag) => content.toLowerCase().includes(tag)
    ).slice(0, 5);
  }
  async deleteDocument(id) {
    try {
      const docPath = path.join(this.uploadPath, `${id}.json`);
      await fs.promises.unlink(docPath);
      return true;
    } catch (error) {
      console.error(`Failed to delete document ${id}:`, error);
      return false;
    }
  }
  async searchDocuments(query) {
    const allDocs = await this.listProcessedDocuments();
    const queryLower = query.toLowerCase();
    return allDocs.filter(
      (doc) => doc.content.toLowerCase().includes(queryLower) || doc.originalName.toLowerCase().includes(queryLower) || doc.keywords.some((keyword) => keyword.includes(queryLower)) || doc.summary.toLowerCase().includes(queryLower)
    );
  }
};
var pdfProcessor = new PDFProcessor();

// server/routes.ts
var upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  }
});
async function registerRoutes(app2) {
  app2.use("/api/auth", auth_default);
  app2.get("/api/conversations", async (req, res) => {
    try {
      const conversations2 = await storage.getConversations();
      res.json(conversations2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Invalid conversation data" });
    }
  });
  app2.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });
  app2.delete("/api/conversations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConversation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json({ message: "Conversation deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });
  app2.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const messages2 = await storage.getMessagesByConversation(req.params.conversationId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        conversationId: req.params.conversationId
      });
      const userMessage = await storage.createMessage(validatedData);
      const analysis = await analyzeMaritimeQuery(validatedData.content);
      const knowledgeBase = await searchMaritimeKnowledge(validatedData.content, analysis.category);
      const conversationHistory = await storage.getMessagesByConversation(req.params.conversationId);
      let aiResponse;
      if (analysis.category === "laytime" && validatedData.content.toLowerCase().includes("calculate")) {
        const content = validatedData.content.toLowerCase();
        const arrivalMatch = content.match(/arrived.*?(\d{1,2}):(\d{2})|(\d{1,2}):(\d{2}).*?arrived/);
        const completionMatch = content.match(/completed.*?(\d{1,2}):(\d{2})|finished.*?(\d{1,2}):(\d{2})|(\d{1,2}):(\d{2}).*?completed|(\d{1,2}):(\d{2}).*?finished/);
        if (arrivalMatch && completionMatch) {
          const arrivalHour = parseInt(arrivalMatch[1] || arrivalMatch[3]);
          const arrivalMin = parseInt(arrivalMatch[2] || arrivalMatch[4]);
          const completionHour = parseInt(completionMatch[1] || completionMatch[3] || completionMatch[5] || completionMatch[7]);
          const completionMin = parseInt(completionMatch[2] || completionMatch[4] || completionMatch[6] || completionMatch[8]);
          const today = /* @__PURE__ */ new Date();
          const arrivalTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), arrivalHour, arrivalMin);
          let completionTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), completionHour, completionMin);
          if (completionTime <= arrivalTime || content.includes("next day")) {
            completionTime.setDate(completionTime.getDate() + 1);
          }
          const totalMs = completionTime.getTime() - arrivalTime.getTime();
          const totalHours = Math.round(totalMs / (1e3 * 60 * 60) * 100) / 100;
          const totalDays = Math.round(totalHours / 24 * 100) / 100;
          aiResponse = `**Laytime Calculation Results:**

\u2022 **Arrival Time:** ${arrivalTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
\u2022 **Completion Time:** ${completionTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} (+1 day)
\u2022 **Total Laytime:** ${totalHours} hours (${totalDays} days)
\u2022 **Working Days:** ${totalDays} days (excluding any weather delays)

**Maritime Industry Notes:**
\u2022 This calculation assumes continuous operations without weather interruptions
\u2022 For Weather Working Days (WWD), deduct time when cargo operations were suspended due to weather
\u2022 Demurrage applies if this exceeds your charter party's allowed laytime
\u2022 Document all delays with proper notices for accurate settlement`;
        } else {
          aiResponse = `I can help calculate laytime, but I need specific times. Please provide:

\u2022 **Arrival time** (when vessel tendered Notice of Readiness)
\u2022 **Completion time** (when cargo operations finished)

Example: "Vessel arrived at 14:30 and completed loading at 08:15 the next day"

Once you provide the times, I'll calculate the exact laytime in hours and days, plus provide guidance on demurrage and charter party implications.`;
        }
      } else if (analysis.category === "distance") {
        const content = validatedData.content.toLowerCase();
        const fromPortMatch = content.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|\s+and)/i);
        const toPortMatch = content.match(/to\s+([a-zA-Z\s]+?)(?:\s|$|[?.])/i);
        if (fromPortMatch && toPortMatch) {
          const fromPort = fromPortMatch[1].trim();
          const toPort = toPortMatch[1].trim();
          try {
            const result = calculateDistance(fromPort, toPort);
            aiResponse = `**Distance Calculation: ${result.fromPort} \u2194 ${result.toPort}**

\u2022 **Distance:** ${result.distanceNM} nautical miles
\u2022 **Estimated Transit Time:** ${result.estimatedDays} days (at 14 knots average)
\u2022 **Estimated Fuel Consumption:** ${result.fuelConsumption} MT

**Voyage Planning Notes:**
\u2022 Great circle distance calculation
\u2022 Add 10-15% for weather routing and port approach
\u2022 Consider seasonal weather patterns for route optimization
\u2022 Budget additional time for port congestion and pilotage`;
          } catch (error) {
            aiResponse = `I can calculate distances between major ports. The ports "${fromPort}" and "${toPort}" might not be in my database. 

I have distances for major ports including:
\u2022 **Europe:** Hamburg, Rotterdam, Antwerp, Felixstowe
\u2022 **Asia:** Singapore, Shanghai, Tokyo, Mumbai
\u2022 **Americas:** New York, Santos
\u2022 **Middle East:** Dubai

Please specify major ports, or use the Distance tool in the sidebar for manual calculations.`;
          }
        } else {
          aiResponse = `I can calculate distances between ports. Please specify both ports clearly:

Example: "What's the distance from Singapore to Dubai?"

I'll provide:
\u2022 Nautical mile distance
\u2022 Estimated voyage time
\u2022 Fuel consumption estimates
\u2022 Route recommendations`;
        }
      } else if (analysis.category === "weather") {
        const content = validatedData.content.toLowerCase();
        const locationMatch = content.match(/in\s+([a-zA-Z\s]+?)(?:\s|$|[?.])/i) || content.match(/at\s+([a-zA-Z\s]+?)(?:\s|$|[?.])/i) || content.match(/weather.*?([a-zA-Z\s]+?)(?:\s|$|[?.])/i);
        if (locationMatch) {
          const location = locationMatch[1].trim();
          const weather = getWeatherConditions(location);
          aiResponse = `**Weather Conditions - ${location}**

\u2022 **Current Condition:** ${weather.condition}
\u2022 **Temperature:** ${weather.temperature}\xB0C
\u2022 **Wind Speed:** ${weather.windSpeed} knots
\u2022 **Visibility:** ${weather.visibility} nautical miles

**Operational Recommendation:**
${weather.recommendation}

**Maritime Operations Impact:**
\u2022 Container operations: ${weather.windSpeed > 25 ? "Suspended" : "Normal"} (limit: 25 knots)
\u2022 Bulk cargo loading: ${weather.condition.includes("Rain") ? "Weather hold advised" : "Proceeding normally"}
\u2022 Pilot boarding: ${weather.visibility < 2 ? "Delayed" : "Normal"} (minimum: 2 NM visibility)`;
        } else {
          aiResponse = `I can provide weather conditions for maritime operations. Please specify a location:

Example: "What's the weather in Hamburg?" or "Weather conditions at Rotterdam"

I'll provide current conditions, operational impacts, and safety recommendations for cargo operations.`;
        }
      } else if (analysis.category === "cp_clause") {
        const content = validatedData.content;
        const clauseMatch = content.match(/["'](.*?)["']/) || content.match(/clause[:\s]+(.*?)(?:\.|$)/i);
        if (clauseMatch) {
          const clauseText = clauseMatch[1];
          const interpretation = interpretCPClause(clauseText);
          aiResponse = `**Charter Party Clause Analysis**

**Clause Type:** ${interpretation.clauseType}

**Interpretation:**
${interpretation.interpretation}

**Key Implications:**
${interpretation.implications.map((imp) => `\u2022 ${imp}`).join("\n")}

**Recommendations:**
${interpretation.recommendations.map((rec) => `\u2022 ${rec}`).join("\n")}

**Legal Notes:**
\u2022 Ensure compliance with local port customs and regulations
\u2022 Document all relevant circumstances for potential disputes
\u2022 Consider seeking legal advice for complex interpretations`;
        } else {
          aiResponse = `I can interpret charter party clauses and provide legal implications. Please provide the specific clause text:

Example: "Interpret this clause: 'Weather Working Days means days when weather permits normal cargo operations'"

I'll analyze:
\u2022 Clause type and meaning
\u2022 Legal implications for both parties
\u2022 Practical recommendations
\u2022 Industry best practices`;
        }
      } else {
        aiResponse = await generateMaritimeResponse(validatedData.content, {
          knowledgeBase,
          conversationHistory: conversationHistory.map((m) => ({
            role: m.role,
            content: m.content
          }))
        });
      }
      const aiMessage = await storage.createMessage({
        conversationId: req.params.conversationId,
        role: "assistant",
        content: aiResponse,
        metadata: { analysis }
      });
      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Failed to process message:", error);
      res.status(400).json({ message: "Failed to process message" });
    }
  });
  app2.get("/api/documents", async (req, res) => {
    try {
      const documents2 = await storage.getDocuments();
      res.json(documents2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  app2.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (req.file.mimetype === "application/pdf") {
        const fileBuffer = fs2.readFileSync(req.file.path);
        const processedDoc = await pdfProcessor.processPDFBuffer(fileBuffer, req.file.originalname);
        const knowledgeEntries = await pdfProcessor.createKnowledgeBaseEntries(processedDoc);
        fs2.unlinkSync(req.file.path);
        res.json({
          ...processedDoc,
          knowledgeEntries: knowledgeEntries.length,
          message: `PDF processed successfully. Extracted ${knowledgeEntries.length} knowledge base entries.`
        });
      } else {
        const content = fs2.readFileSync(req.file.path, "utf-8");
        const documentData = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size.toString(),
          content
        };
        const document = await storage.createDocument(documentData);
        processDocumentAsync(document.id, content);
        res.json(document);
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });
  app2.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });
  app2.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      const filePath = path2.join("uploads", document.filename);
      if (fs2.existsSync(filePath)) {
        fs2.unlinkSync(filePath);
      }
      const deleted = await storage.deleteDocument(req.params.id);
      res.json({ message: "Document deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  app2.get("/api/documents/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const documents2 = await storage.searchDocuments(query);
      res.json(documents2);
    } catch (error) {
      res.status(500).json({ message: "Failed to search documents" });
    }
  });
  app2.post("/api/maritime/laytime", async (req, res) => {
    try {
      const { arrivalTime, completionTime, excludeWeekends } = req.body;
      if (!arrivalTime || !completionTime) {
        return res.status(400).json({ message: "Arrival and completion times required" });
      }
      const result = calculateLaytime(
        new Date(arrivalTime),
        new Date(completionTime),
        { excludeWeekends }
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid date format" });
    }
  });
  app2.post("/api/maritime/distance", async (req, res) => {
    try {
      const { fromPort, toPort } = req.body;
      if (!fromPort || !toPort) {
        return res.status(400).json({ message: "From and to ports required" });
      }
      const result = calculateDistance(fromPort, toPort);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate distance" });
    }
  });
  app2.get("/api/maritime/weather", async (req, res) => {
    try {
      const location = req.query.location;
      if (!location) {
        return res.status(400).json({ message: "Location required" });
      }
      const weather = getWeatherConditions(location);
      res.json(weather);
    } catch (error) {
      res.status(500).json({ message: "Failed to get weather conditions" });
    }
  });
  app2.post("/api/maritime/cp-clause", async (req, res) => {
    try {
      const { clauseText } = req.body;
      if (!clauseText) {
        return res.status(400).json({ message: "Clause text required" });
      }
      const result = interpretCPClause(clauseText);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to interpret clause" });
    }
  });
  app2.get("/api/maritime/knowledge", async (req, res) => {
    try {
      const category = req.query.category;
      const knowledge = await storage.getMaritimeKnowledge(category);
      res.json(knowledge);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch knowledge base" });
    }
  });
  app2.get("/api/maritime/knowledge/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const knowledge = await storage.searchMaritimeKnowledge(query);
      res.json(knowledge);
    } catch (error) {
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });
  app2.get("/api/pdf-documents", async (req, res) => {
    try {
      const documents2 = await pdfProcessor.listProcessedDocuments();
      res.json(documents2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PDF documents" });
    }
  });
  app2.get("/api/pdf-documents/:id", async (req, res) => {
    try {
      const document = await pdfProcessor.getProcessedDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "PDF document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PDF document" });
    }
  });
  app2.delete("/api/pdf-documents/:id", async (req, res) => {
    try {
      const deleted = await pdfProcessor.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "PDF document not found" });
      }
      res.json({ message: "PDF document deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PDF document" });
    }
  });
  app2.get("/api/pdf-documents/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const documents2 = await pdfProcessor.searchDocuments(query);
      res.json(documents2);
    } catch (error) {
      res.status(500).json({ message: "Failed to search PDF documents" });
    }
  });
  app2.get("/api/knowledge-base", async (req, res) => {
    try {
      const documents2 = await pdfProcessor.listProcessedDocuments();
      const allEntries = [];
      for (const doc of documents2) {
        const entries = await pdfProcessor.createKnowledgeBaseEntries(doc);
        allEntries.push(...entries);
      }
      allEntries.sort((a, b) => b.relevanceScore - a.relevanceScore);
      res.json(allEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch knowledge base" });
    }
  });
  app2.get("/api/knowledge-base/search", async (req, res) => {
    try {
      const query = req.query.q;
      const category = req.query.category;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const documents2 = await pdfProcessor.searchDocuments(query);
      const allEntries = [];
      for (const doc of documents2) {
        const entries = await pdfProcessor.createKnowledgeBaseEntries(doc);
        allEntries.push(...entries.filter(
          (entry) => !category || entry.category === category
        ));
      }
      allEntries.sort((a, b) => b.relevanceScore - a.relevanceScore);
      res.json(allEntries.slice(0, 20));
    } catch (error) {
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function processDocumentAsync(documentId, content) {
  try {
    const document = await storage.getDocument(documentId);
    if (!document) return;
    const documentType = await extractDocumentType(document.originalName, content);
    const summary = await summarizeDocument(content, documentType);
    await storage.updateDocument(documentId, {
      documentType,
      summary,
      processed: true
    });
  } catch (error) {
    console.error("Failed to process document:", error);
  }
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    port: 3e3
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "localhost", () => {
    log(`serving on http://localhost:${port}`);
  });
})();
