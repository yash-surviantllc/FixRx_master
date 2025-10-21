# Socket.IO Integration Guide

This document provides an overview of the Socket.IO implementation in the FixRX backend, including setup instructions, event documentation, and usage examples.

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Event Types](#event-types)
- [Room Structure](#room-structure)
- [Emitting Events](#emitting-events)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The Socket.IO integration provides real-time communication capabilities to the FixRX application. It's used for:

- Real-time service updates
- Booking status changes
- Payment notifications
- Live chat between users and vendors

## Setup

1. **Dependencies**:
   - `socket.io` (already included in package.json)

2. **Environment Variables**:
   ```env
   # Required
   CLIENT_ORIGIN=http://localhost:3000  # Or your frontend URL
   
   # Optional
   WS_PATH=/socket.io  # Custom WebSocket path if needed
   ```

3. **Server Initialization**:
   The Socket.IO server is automatically initialized when the Express app starts. The server is available at `app.get('io')`.

## Event Types

### Service Events
- `service:created` - A new service has been created
- `service:updated` - A service has been updated
- `service:status_changed` - A service's status has changed

### Booking Events
- `booking:created` - A new booking has been created
- `booking:status_changed` - A booking's status has changed
- `booking:cancelled` - A booking has been cancelled

### Payment Events
- `payment:completed` - A payment has been completed successfully
- `payment:failed` - A payment has failed

## Room Structure

Rooms are used to target specific users or vendors with events:

- `user:{userId}` - Room for a specific user
- `vendor:{vendorId}` - Room for a specific vendor

## Emitting Events

Use the emitter functions in `src/socket/emitters.js` to send events:

```javascript
const { emitServiceCreated } = require('./socket/emitters');

// In your controller
try {
  const service = await db.service.create(serviceData);
  const actor = { id: req.user.id, role: req.user.role };
  emitServiceCreated(req.app.get('io'), { service, actor });
  // ...
} catch (error) {
  // Handle error
}
```

## Testing

### Smoke Test Client

A test client is available at `dev/smoke-socket-client.js`:

```bash
# Basic usage
node dev/smoke-socket-client.js

# With custom user and vendor IDs
TEST_USER=user123 TEST_VENDOR=vendor456 node dev/smoke-socket-client.js

# With custom WebSocket URL
WS_URL=http://your-server:3000 node dev/smoke-socket-client.js
```

### Available Commands
- `ping` - Test the connection
- `join <type> <id>` - Join a room (e.g., `join user 123`)
- `help` - Show help
- `exit` - Exit the client

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify the server is running and accessible
   - Check CORS settings if connecting from a different origin
   - Ensure WebSocket protocol is allowed by your network/firewall

2. **Events Not Received**
   - Verify the client is connected to the correct room
   - Check the server logs for any errors
   - Ensure the event is being emitted with the correct room names

3. **Authentication Issues**
   - Verify the authentication token is valid (if using JWT)
   - Check that the user has the required permissions

### Logging

Socket.IO debug logs can be enabled by setting the `DEBUG` environment variable:

```bash
DEBUG=socket.io* node server.js
```

## Security Considerations

1. Always validate data before emitting events
2. Use rooms to restrict event broadcasting
3. Implement proper authentication for sensitive events
4. Rate limit event emissions to prevent abuse
5. Keep Socket.IO and its dependencies up to date
