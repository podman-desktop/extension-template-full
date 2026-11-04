FROM registry.access.redhat.com/ubi10/nodejs-24-minimal:10.1-1766060610 AS builder

WORKDIR /opt/app-root/src

COPY --chown=1001:1001 . .

RUN npm ci
RUN npm run build

FROM scratch

COPY --from=builder /opt/app-root/src/packages/backend/dist/ /extension/dist
COPY --from=builder /opt/app-root/src/packages/backend/package.json /extension/
COPY --from=builder /opt/app-root/src/packages/backend/media/ /extension/media
COPY --from=builder /opt/app-root/src/LICENSE /extension/
COPY --from=builder /opt/app-root/src/packages/backend/icon.png /extension/
COPY --from=builder /opt/app-root/src/README.md /extension/

LABEL org.opencontainers.image.title="Your Hello World Extension" \
        org.opencontainers.image.description="Hello World Extension" \
        org.opencontainers.image.vendor="Your Org / Username" \
        io.podman-desktop.api.version=">= 1.12.0"
