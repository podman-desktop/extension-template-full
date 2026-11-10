FROM registry.access.redhat.com/ubi10/nodejs-24-minimal:1791463197@sha256:498ccfc43f6fe349a4d87db6af6d83ab420e9450f3800140cdc90c290dcd462f AS builder

WORKDIR /opt/app-root/src

COPY --chown=1001:1001 . .

RUN npm ci
RUN npm run build

# Assemble the extension layout, so the final stage is a single COPY
RUN mkdir -p /opt/app-root/extension
RUN cp -r packages/backend/dist /opt/app-root/extension/
RUN cp packages/backend/package.json /opt/app-root/extension/
RUN cp -r packages/backend/media /opt/app-root/extension/
RUN cp packages/backend/icon.png /opt/app-root/extension/
RUN cp LICENSE /opt/app-root/extension/
RUN cp README.md /opt/app-root/extension/

FROM scratch

COPY --from=builder /opt/app-root/extension /extension

LABEL org.opencontainers.image.title="Your Hello World Extension" \
        org.opencontainers.image.description="Hello World Extension" \
        org.opencontainers.image.vendor="Your Org / Username" \
        io.podman-desktop.api.version=">= 1.12.0"
