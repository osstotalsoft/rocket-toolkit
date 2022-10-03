// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

const topicPrefix: string =
  (process.env.Messaging__Env ? process.env.Messaging__Env + '.' : null) || process.env.Messaging__TopicPrefix || ''

export function getFullTopicName(topic: string): string {
  return topicPrefix + topic
}
