import { IWebSocketAdapter } from '../@types/adapters'
import { IncomingMessage, MessageType } from '../@types/messages'
import { IEventRepository, IUserRepository } from '../@types/repositories'
import { AuthEventMessageHandler } from '../handlers/auth-event-message-handler'
import { DelegatedEventMessageHandler } from '../handlers/delegated-event-message-handler'
import { EventMessageHandler } from '../handlers/event-message-handler'
import { SubscribeMessageHandler } from '../handlers/subscribe-message-handler'
import { UnsubscribeMessageHandler } from '../handlers/unsubscribe-message-handler'
import { isDelegatedEvent } from '../utils/event'
import { signedAuthEventStrategyFactory } from './auth-event-strategy-factory'
import { delegatedEventStrategyFactory } from './delegated-event-strategy-factory'
import { eventStrategyFactory } from './event-strategy-factory'
import { slidingWindowRateLimiterFactory } from './rate-limiter-factory'
import { createSettings } from './settings-factory'

export const messageHandlerFactory = (
  eventRepository: IEventRepository,
  userRepository: IUserRepository,
) => ([message, adapter]: [IncomingMessage, IWebSocketAdapter]) => {
  switch (message[0]) {
    case MessageType.EVENT:
      {
        if (isDelegatedEvent(message[1])) {
          return new DelegatedEventMessageHandler(
            adapter,
            delegatedEventStrategyFactory(eventRepository),
            userRepository,
            createSettings,
            slidingWindowRateLimiterFactory,
          )
        }

        return new EventMessageHandler(
          adapter,
          eventStrategyFactory(eventRepository),
          userRepository,
          createSettings,
          slidingWindowRateLimiterFactory,
        )
      }
    case MessageType.REQ:
      return new SubscribeMessageHandler(adapter, eventRepository, createSettings)
    case MessageType.AUTH: {
        return new AuthEventMessageHandler(
          adapter,
          signedAuthEventStrategyFactory(),
          userRepository,
          createSettings,
          slidingWindowRateLimiterFactory,
        )
      }  
    case MessageType.CLOSE:
      return new UnsubscribeMessageHandler(adapter,)
    default:
      throw new Error(`Unknown message type: ${String(message[0]).substring(0, 64)}`)
  }
}
