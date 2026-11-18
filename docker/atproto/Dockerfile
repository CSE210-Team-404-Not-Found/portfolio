# Bluesky's local network for client development, as one process.
FROM node:24-bookworm-slim
RUN npm install -g --allow-scripts=sharp,better-sqlite3,protobufjs @atproto/dev-env@0.7.13
# The package's bin has no shebang line, so run it through node.
CMD ["node", "/usr/local/lib/node_modules/@atproto/dev-env/dist/bin.js"]
