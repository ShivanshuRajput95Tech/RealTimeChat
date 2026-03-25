# QuickChat - AI-Native Real-Time Communication Platform

A production-grade, real-time communication platform combining features from WhatsApp, Slack, and Discord with AI-first capabilities.

**Version 3.0** - Enhanced with enterprise-grade security, performance optimizations, and comprehensive monitoring.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Setup environment variables
cp server/.env.example server/.env  # Then edit with your credentials

# 3. Start servers (two terminals)
cd server && npm run server    # Terminal 1 - Backend (port 5000)
cd client && npm run dev       # Terminal 2 - Frontend (port 5173)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Next.js)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │AuthContext│ │ChatCtx   │ │Workspace │ │AI Ctx  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────┐
│              API Gateway (Express)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Rate Limit│ │Helmet    │ │CORS      │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────────────────────────────────────────┐   │
│  │           WebSocket (Socket.IO)               │   │
│  └──────────────────────────────────────────────┘   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌──────┐ │
│  │Auth   │ │Msg    │ │Channel│ │Group  │ │AI    │ │
│  │Route  │ │Route  │ │Route  │ │Route  │ │Route │ │
│  └───────┘ └───────┘ └───────┘ └───────┘ └──────┘ │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  Data Layer                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │MongoDB   │ │Redis     │ │Cloudinary│            │
│  │(Primary) │ │(Cache)   │ │(Files)   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

---

## Features

### Core Messaging
| Feature | Status | Description |
|---------|--------|-------------|
| Direct Messages | Done | 1:1 private messaging with real-time delivery |
| Group Chats | Done | Multi-user group messaging |
| Channels | Done | Workspace-based channels (Slack-style) |
| Threads | Done | Threaded replies on any message |
| File Uploads | Done | Image and file sharing via Cloudinary |
| Message Reactions | Done | Emoji reactions with real-time sync |
| Message Editing | Done | Edit your own messages with edit history |
| Message Deletion | Done | Soft-delete messages |
| Pin Messages | Done | Pin/unpin messages in any conversation |
| Scheduled Messages | Done | Schedule messages for later delivery |
| Broadcast Messages | Done | Send to all workspace members |
| Message Forwarding | Done | Forward messages to users/channels/groups |
| Message Bookmarks | Done | Bookmark messages for quick access |

### Real-Time Features
| Feature | Status | Description |
|---------|--------|-------------|
| Online Presence | Done | Real-time online/offline status |
| User Status | Done | Online, Idle, DND, Offline |
| Typing Indicators | Done | See when others are typing |
| Message Sync | Done | Real-time message delivery |
| Reaction Sync | Done | Real-time reaction updates |
| Edit/Delete Sync | Done | Real-time message updates |

### Voice & Video
| Feature | Status | Description |
|---------|--------|-------------|
| Audio Calls | Done | 1:1 WebRTC audio calls |
| Video Calls | Done | 1:1 WebRTC video calls |
| Screen Sharing | Done | Share screen during calls |
| Call Signaling | Done | Socket.IO based signaling |

### Workspace & Community
| Feature | Status | Description |
|---------|--------|-------------|
| Workspaces | Done | Create and join workspaces |
| Invite Codes | Done | Join via invite codes |
| RBAC | Done | Owner, Admin, Moderator, Member roles |
| Member Management | Done | Add/remove/change roles |

### AI Features
| Feature | Status | Description |
|---------|--------|-------------|
| Smart Replies | Done | AI-generated reply suggestions |
| Conversation Summary | Done | Summarize any conversation |
| Translation | Done | Real-time message translation |
| Language Detection | Done | Auto-detect message language |
| Message Drafting | Done | AI-assisted message writing |
| Toxicity Detection | Done | Content moderation |
| AI Chat Copilot | Done | Chat with AI assistant |
| Autocomplete | Done | AI message autocomplete |

### UI/UX
| Feature | Status | Description |
|---------|--------|-------------|
| Dark Theme | Done | Dark-first design |
| Command Palette | Done | Ctrl+K quick actions |
| Context Menus | Done | Right-click message actions |
| Emoji Picker | Done | Rich emoji picker |
| Responsive | Done | Mobile-friendly layout |

### Security & Performance
| Feature | Status | Description |
|---------|--------|-------------|
| Rate Limiting | Done | Per-user and per-IP rate limits |
| Helmet Security | Done | Security headers |
| CORS | Done | Cross-origin protection |
| JWT Auth | Done | Token-based authentication |
| Redis Caching | Done | Fast data caching |
| Winston Logging | Done | Structured logging |
| Input Validation | Done | Request validation |
| Message Pagination | Done | Cursor-based pagination |

### Notifications
| Feature | Status | Description |
|---------|--------|-------------|
| Notification System | Done | In-app notifications for messages, mentions, reactions |
| Unread Badge | Done | Real-time unread notification count |
| Mark Read/Clear | Done | Mark individual or all notifications as read |

---

## 🛡️ Security & Performance (v3.0 Enhancements)

### Security Features
| Feature | Description |
|---------|-------------|
| Enhanced Security Middleware | Comprehensive protection with helmet, CORS, rate limiting, and input sanitization |
| XSS Protection | Cross-site scripting protection using modern sanitization techniques |
| NoSQL Injection Prevention | MongoDB query injection protection |
| HTTP Parameter Pollution | Protection against parameter pollution attacks |
| Rate Limiting | Separate rate limits for different endpoint types |
| Request Validation | Enhanced validation with detailed error messages |

### Performance Optimizations
| Feature | Description |
|---------|-------------|
| Query Optimizer | Advanced query optimization with intelligent caching |
| Database Index Recommendations | Automatic analysis and optimization suggestions |
| Connection Pool Optimization | Dynamic pool sizing based on system resources |
| Cursor-based Pagination | Efficient pagination for large datasets |
| Response Compression | Smart compression with automatic filtering |
| Cache Strategies | Multiple caching strategies for different data types |

### Monitoring & Observability
| Feature | Description |
|---------|-------------|
| Enhanced Health Checks | Comprehensive system monitoring |
| Request ID Tracking | Unique IDs for debugging and tracing |
| Performance Monitoring | Automatic slow request detection |
| Structured Logging | Detailed logs with request context |

---

## API Endpoints

### Authentication
```
POST   /api/auth/signup              Register new user
POST   /api/auth/login               Login
GET    /api/auth/check               Verify token
PUT    /api/auth/update-profile      Update profile
PUT    /api/auth/settings            Update user settings
GET    /api/auth/search              Search users
GET    /api/auth/:userId             Get user by ID
```

### Messages
```
GET    /api/messages/users                   Get users for sidebar
GET    /api/messages/:id                     Get messages with user
POST   /api/messages/send/:id                Send message
PUT    /api/messages/:messageId              Edit message
DELETE /api/messages/:messageId              Delete message
PUT    /api/messages/mark/:id                Mark message as seen
PUT    /api/messages/mark-all/:id            Mark all as read
POST   /api/messages/:messageId/reactions    Toggle reaction
PUT    /api/messages/:messageId/pin          Pin/unpin message
GET    /api/messages/:messageId/thread       Get thread replies
POST   /api/messages/:messageId/thread       Send thread reply
GET    /api/messages/search                  Search messages
GET    /api/messages/scheduled               Get scheduled messages
POST   /api/messages/schedule                Schedule a message
DELETE /api/messages/schedule/:id            Cancel scheduled message
GET    /api/messages/pinned                  Get pinned messages
POST   /api/messages/:messageId/forward      Forward message
POST   /api/messages/:messageId/bookmark     Toggle bookmark
GET    /api/messages/bookmarks/list          Get bookmarked messages
```

### Workspaces
```
GET    /api/workspaces                       Get user workspaces
POST   /api/workspaces                       Create workspace
GET    /api/workspaces/:id                   Get workspace details
PUT    /api/workspaces/:id                   Update workspace
DELETE /api/workspaces/:id                   Delete workspace
POST   /api/workspaces/join                  Join with invite code
POST   /api/workspaces/:id/leave             Leave workspace
POST   /api/workspaces/:id/regenerate-invite Regenerate invite code
PUT    /api/workspaces/:wid/members/:uid/role Update member role
DELETE /api/workspaces/:wid/members/:uid     Remove member
```

### Channels
```
GET    /api/channels/:workspaceId            Get workspace channels
POST   /api/channels/:workspaceId            Create channel
GET    /api/channels/:id                     Get channel details
PUT    /api/channels/:id                     Update channel
DELETE /api/channels/:id                     Delete channel
GET    /api/channels/:id/messages            Get channel messages
POST   /api/channels/:id/messages            Send channel message
PUT    /api/channels/:id/pin/:messageId      Pin message in channel
PUT    /api/channels/:id/archive             Archive channel
```

### Groups
```
GET    /api/groups                           Get user groups
POST   /api/groups                           Create group
GET    /api/groups/:id                       Get group details
PUT    /api/groups/:id                       Update group
DELETE /api/groups/:id                       Delete group
GET    /api/groups/:id/messages              Get group messages
POST   /api/groups/:id/messages              Send group message
POST   /api/groups/:id/members               Add members
DELETE /api/groups/:id/members/:userId       Remove member
POST   /api/groups/:id/leave                 Leave group
```

### Broadcasts
```
POST   /api/broadcasts/send                  Send workspace broadcast
GET    /api/broadcasts                       Get broadcasts
```

### AI
```
GET    /api/ai/smart-replies                 Get smart reply suggestions
GET    /api/ai/summarize                     Summarize conversation
GET    /api/ai/search                        AI-powered search
POST   /api/ai/translate/:id                 Translate message
POST   /api/ai/detect-language               Detect language
POST   /api/ai/draft                         Draft message
POST   /api/ai/moderate                      Check toxicity
POST   /api/ai/autocomplete                  Message autocomplete
```

### Notifications
```
GET    /api/notifications                    Get notifications
GET    /api/notifications/unread-count       Get unread count
PUT    /api/notifications/read-all           Mark all as read
PUT    /api/notifications/:id/read           Mark as read
DELETE /api/notifications/:id                Delete notification
DELETE /api/notifications                    Clear all notifications
```

---

## WebSocket Events

### Client -> Server
| Event | Payload | Description |
|-------|---------|-------------|
| `typing` | `{ receiverId, channelId, groupId }` | Start typing indicator |
| `stopTyping` | `{ receiverId, channelId, groupId }` | Stop typing indicator |
| `joinChannel` | `channelId` | Join channel room |
| `leaveChannel` | `channelId` | Leave channel room |
| `joinGroup` | `groupId` | Join group room |
| `leaveGroup` | `groupId` | Leave group room |
| `statusChange` | `{ status, statusText }` | Update user status |
| `messageReacted` | `{ messageId, reactions, targetId }` | Sync reaction |
| `markRead` | `{ conversationId }` | Mark conversation read |
| `call-offer` | `{ offer, to, type }` | WebRTC call offer |
| `call-answer` | `{ answer, to }` | WebRTC call answer |
| `ice-candidate` | `{ candidate, to }` | ICE candidate |
| `call-ended` | `{ to }` | End call |
| `call-rejected` | `{ to }` | Reject call |

### Server -> Client
| Event | Payload | Description |
|-------|---------|-------------|
| `getOnlineUsers` | `[userId]` | List of online users |
| `userTyping` | `{ userId, channelId, groupId }` | User started typing |
| `userStopTyping` | `{ userId, channelId, groupId }` | User stopped typing |
| `newMessage` | `message` | New message received |
| `messageSeen` | `{ messageId, by }` | Message was seen |
| `messagesSeen` | `{ by, count }` | Multiple messages seen |
| `messageUpdated` | `message` | Message was edited |
| `messageDeleted` | `{ messageId }` | Message was deleted |
| `messageReactions` | `{ messageId, reactions }` | Reaction update |
| `messagePinned` | `{ messageId, pinned }` | Pin/unpin update |
| `userStatusChange` | `{ userId, status }` | User status changed |
| `channel:newMessage` | `{ channelId, message }` | Channel message |
| `group:newMessage` | `{ groupId, message }` | Group message |
| `call-offer` | `{ offer, type, from }` | Incoming call |
| `call-answer` | `{ answer }` | Call answered |
| `ice-candidate` | `{ candidate }` | ICE candidate |
| `call-ended` | - | Call ended |
| `call-rejected` | - | Call rejected |
| `notification` | `notification` | New notification received |

---

## Environment Variables

### Server (.env)
```
PORT=5000
NODE_ENV=development
JWT_SECRET="your-secret-key"
CLIENT_URL="http://localhost:5173"
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net"
REDIS_URL="redis://localhost:6379"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
OPENAI_API_KEY="your-openai-key"
AI_BASE_URL="https://api.openai.com/v1"
LOG_LEVEL="info"
```

### Client (.env)
```
VITE_BACKEND_URL="http://localhost:5000"
```

---

## Data Models

### User
```javascript
{
  email: String,        // unique
  fullName: String,
  password: String,     // hashed
  profilePic: String,   // URL
  bio: String,
  status: String,       // online | idle | dnd | offline
  statusText: String,
  workspaces: [ObjectId],
  groups: [ObjectId],
  bookmarks: [ObjectId], // bookmarked messages
  settings: {
    theme: String,      // dark | light | system
    notifications: Boolean,
    soundEnabled: Boolean,
    language: String
  }
}
```

### Message
```javascript
{
  senderId: ObjectId,
  receiverId: ObjectId,     // for DMs
  channelId: ObjectId,      // for channels
  groupId: ObjectId,        // for groups
  threadId: ObjectId,       // for thread replies
  replyTo: ObjectId,        // reply reference
  forwardedFrom: ObjectId,  // original message ID (when forwarded)
  forwardedFromUser: ObjectId, // original sender (when forwarded)
  text: String,
  image: String,            // URL
  file: { url, name, size, type },
  type: String,             // text | image | file | system | broadcast
  seen: Boolean,
  seenAt: Date,
  seenBy: [ObjectId],
  reactions: [{ emoji, users }],
  pinned: Boolean,
  edited: Boolean,
  editedAt: Date,
  deleted: Boolean,
  threadCount: Number,
  scheduled: Boolean,
  scheduledAt: Date,
  sentAt: Date,
  mentions: [ObjectId],
  metadata: { device, platform, location }
}
```

### Workspace
```javascript
{
  name: String,
  description: String,
  icon: String,
  owner: ObjectId,
  members: [{ user: ObjectId, role: String }],
  inviteCode: String,
  inviteEnabled: Boolean,
  settings: {
    defaultRole: String,
    allowInvites: Boolean,
    messageRetention: Number
  }
}
```

### Channel
```javascript
{
  name: String,
  topic: String,
  type: String,             // text | voice
  workspace: ObjectId,
  category: String,
  position: Number,
  isPrivate: Boolean,
  allowedMembers: [ObjectId],
  pinnedMessages: [ObjectId],
  archived: Boolean,
  slowMode: Number,
  lastMessageAt: Date
}
```

### Group
```javascript
{
  name: String,
  description: String,
  avatar: String,
  members: [ObjectId],
  admins: [ObjectId],
  createdBy: ObjectId,
  lastMessageAt: Date,
  settings: {
    onlyAdminsCanPost: Boolean,
    onlyAdminsCanAddMembers: Boolean,
    disappearingMessages: Number
  }
}
```

### Notification
```javascript
{
  recipient: ObjectId,     // user who receives
  sender: ObjectId,        // user who triggered
  type: String,            // message | mention | reaction | reply | thread | workspace_invite | group_invite | system
  title: String,
  body: String,
  link: String,
  read: Boolean,
  readAt: Date,
  data: {
    messageId: ObjectId,
    channelId: ObjectId,
    groupId: ObjectId,
    workspaceId: ObjectId
  }
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Cache | Redis (ioredis) |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken) |
| Files | Cloudinary |
| Logging | Winston |
| Security | Helmet, express-rate-limit |
| Calls | WebRTC |

---

## Project Structure

```
QuickChat-Full-Stack/
├── client/                     # React frontend
│   ├── context/                # React contexts
│   │   ├── AuthContext.jsx     # Auth + socket
│   │   ├── ChatContext.jsx     # DM messages
│   │   ├── WorkspaceContext.jsx# Workspaces/channels
│   │   ├── GroupContext.jsx    # Groups
│   │   └── AIContext.jsx       # AI features
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── ChannelChat.jsx
│   │   │   ├── GroupChat.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── WorkspaceSidebar.jsx
│   │   │   ├── AICopilotPanel.jsx
│   │   │   ├── ThreadPanel.jsx
│   │   │   ├── CommandPalette.jsx
│   │   │   ├── CallManager.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── RightSidebar.jsx
│   │   └── pages/
│   │       ├── HomePage.jsx
│   │       ├── LoginPage.jsx
│   │       └── ProfilePage.jsx
│   └── package.json
│
├── server/                     # Node.js backend
│   ├── controllers/            # Route handlers
│   │   ├── userController.js
│   │   ├── messageController.js
│   │   ├── channelController.js
│   │   ├── groupController.js
│   │   ├── workspaceController.js
│   │   ├── aiController.js
│   │   ├── broadcastController.js
│   │   └── notificationController.js
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Workspace.js
│   │   ├── Channel.js
│   │   ├── Group.js
│   │   └── Notification.js
│   ├── routes/                 # Express routes
│   │   ├── userRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── channelRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── workspaceRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── broadcastRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/             # Express middleware
│   │   ├── auth.js            # JWT verification
│   │   ├── rbac.js            # Role-based access
│   │   ├── rateLimiter.js     # Rate limiting
│   │   └── validation.js      # Input validation
│   ├── services/              # Business logic
│   │   ├── aiService.js       # AI integration
│   │   └── schedulerService.js# Scheduled messages
│   ├── lib/                   # Utilities
│   │   ├── db.js              # MongoDB connection
│   │   ├── redis.js           # Redis client
│   │   ├── logger.js          # Winston logger
│   │   ├── cloudinary.js      # File uploads
│   │   ├── utils.js           # JWT generation
│   │   └── invite.js          # Invite codes
│   ├── server.js              # Main entry
│   └── package.json
│
└── README.md
```

---

## License

MIT
