import { getCacheClient } from '../../cache/client'
 import { createLogger } from '../../factories/logger-factory'
 import { Event } from '../../@types/event'
 import { IEventStrategy } from '../../@types/message-handlers'
 import { isValidSignedAuthEvent } from '../../utils/event'
 import { IWebSocketAdapter } from '../../@types/adapters'
 import { WebSocketAdapterEvent } from '../../constants/adapter'
 import { IUserRepository } from '../../@types/repositories'
 import { ICacheAdapter } from '../../@types/adapters'
import { createCommandResult } from '../../utils/messages'


 const permittedChallengeResponseTimeDelayMs = (1000 * 60 * 10) // 10 min
 const debug = createLogger('default-event-strategy')

 export class SignedAuthEventStrategy implements IEventStrategy<Event, Promise<void>> {
   public constructor(
     private readonly webSocket: IWebSocketAdapter,
     private readonly userRepository: IUserRepository,
     private readonly cache: ICacheAdapter
   ) { }

   public async execute(event: Event): Promise<void> {
     debug('received signedAuth event: %o', event)
     const { challenge, createdAt } = this.webSocket.getClientAuthChallengeData()
     const verified = isValidSignedAuthEvent(event, challenge)

     const timeIsWithinBounds = (createdAt.getTime() + permittedChallengeResponseTimeDelayMs) > Date.now()

     //const user = await this.userRepository.findByPubkey(event.pubkey)

     
      

     const user = await this.cache.hasKey('username_' + event.pubkey)

     debug('AUTH ', timeIsWithinBounds, verified, user?user:'no user found...')
     if (verified && timeIsWithinBounds && user) {
        console.log('setClientToAuthenticated')
        
       this.webSocket.setClientToAuthenticated(event.pubkey)
       this.webSocket.emit(WebSocketAdapterEvent.Message, createCommandResult(event.id, true, 'authentication: succeeded'))
       return
     }

     this.webSocket.emit(WebSocketAdapterEvent.Message, createCommandResult(event.id, false, 'authentication: failed'))
   }
 }