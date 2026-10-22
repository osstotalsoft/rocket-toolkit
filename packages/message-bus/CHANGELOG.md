# @totalsoft/message-bus

## 2.10.3

### Patch Changes

- 2f40df2: Security: bump `@grpc/grpc-js` to ^1.14.6 (GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4) and `tedious` to ^20.3.8 (drops vulnerable `sprintf-js`, GHSA-hp3w-g68c-fv3c)

## 2.10.2

### Patch Changes

- c9bc584: Update dependencies and apply audit fixes.

## 2.10.1

### Patch Changes

- 17fd694: upgrage messahe-bus grpc deps
- 34f640b: Msgbus Rusi transport emit subscription error

## 2.10.0

### Minor Changes

- 0e2a4ba: set jetstream consumer inactive_threshold=1h

## 2.9.0

### Minor Changes

- e487c54: fix: update ack wait times to 30 seconds and refactor subscription handling
- c9f6893: fix spacing between client id and topic name

## 2.8.0

### Minor Changes

- 8621f84: fix jetstream default import

## 2.7.0

### Minor Changes

- 62bf18c: fix nats imports

## 2.6.0

### Minor Changes

- 9b78c0a: Bump nats version and refactor streams

## 2.5.0

### Minor Changes

- adf0957: Added JetStream messaging transport for message-bus

## 2.4.9

### Patch Changes

- 3107104: Fixed sendCommandAndWaitForEvent unhandled rejection

## 2.4.8

### Patch Changes

- d649104: Fixed grpc default import issue

## 2.4.7

### Patch Changes

- 31d4647: Provider independent, high-level, opinionated messaging library
