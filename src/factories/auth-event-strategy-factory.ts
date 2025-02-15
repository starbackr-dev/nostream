import { Event } from '../@types/event'
 import { Factory } from '../@types/base'
 import { IEventStrategy } from '../@types/message-handlers'
 import { ICacheAdapter, IWebSocketAdapter } from '../@types/adapters'
 import { SignedAuthEventStrategy } from '../handlers/event-strategies/auth-event-strategy'
 import { UserRepository } from '../repositories/user-repository'
 import { getMasterDbClient, getReadReplicaDbClient } from '../database/client'
import { RedisAdapter } from '../adapters/redis-adapter'
import { getCacheClient } from '../cache/client'

    

 export const signedAuthEventStrategyFactory = (
 ): Factory<IEventStrategy<Event, Promise<void>>, [Event, IWebSocketAdapter]> =>
   ([, adapter]: [Event, IWebSocketAdapter]) => {

    const dbClient = getMasterDbClient()
    const userRepository = new UserRepository(dbClient)  
    const cache = new RedisAdapter(getCacheClient())   
     return new SignedAuthEventStrategy(adapter, userRepository, cache)
   }