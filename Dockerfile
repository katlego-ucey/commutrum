FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm run build

FROM base AS runner
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/packages/api-server/dist /app/packages/api-server/dist
# If packages/db needs to be compiled:
# COPY --from=build /app/packages/db/dist /app/packages/db/dist

EXPOSE 3000
CMD [ "pnpm", "--filter", "@commutrum/api-server", "start" ]
