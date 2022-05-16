import { BaseContext } from 'apollo-server-types'

export interface MyApolloContext extends BaseContext {
  requestId: string
}
